import torpor from "@torpor/unplugin/vite";
import { configDotenv } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
	type AliasOptions,
	createServer as createViteServer,
	type Plugin,
	type ViteDevServer,
} from "vite";
import Site from "../site/Site.ts";
import {
	checkApiCallSource,
	checkApiCalls,
	checkRoute,
	checkRoutes,
	createApiCallCheck,
	type RouteCheckIssue,
	reportRouteIssues,
} from "../site/checkRoutes";
import manifest, { MANIFEST_MODULE_ID } from "../site/manifest.ts";
import { checkLayoutSlot, checkLayoutSlots } from "../site/checkLayoutSlots";
import { LAYOUT_ROUTE } from "../types/RouteType";
import tsconfigAliases, { type AliasEntry } from "../utils/tsconfigAliases";
import { addTorporPackageConfig } from "../utils/torporPackages";
import { detectSourceMode, siteEntryPaths } from "../utils/entryPaths";
import devPlugin from "./devPlugin.ts";
import { clearStaleDepCache } from "./depCache";
import { configDependencyFiles, loadSite } from "./loadSite.ts";
import { reportStaleTorpCopies } from "./staleTorpCopies";

/**
 * @param configVite The Vite server used to load the site config (see
 * `loadSite`). Its module graph tells the dev server which files the config
 * imports, so `addRoute` calls in those files (e.g. a `routes.ts`) trigger a
 * route reload too. Without it, only file-based routes are reloaded.
 */
export default async function runDev(site: Site, configVite?: ViteDevServer): Promise<void> {
	// Create the Vite dev server. Unlike the previous middleware-mode setup, we
	// let Vite own the HTTP server (so HMR/websockets work natively) and let the
	// adapter's `dev()` plugin(s) handle SSR via configureServer.
	const config = structuredClone(site.viteConfig ?? {});
	config.appType = "custom";
	config.server ??= {};
	config.server.host ??= "localhost";
	// Root-level host files (robots.txt, favicon.ico, etc) in src/public are
	// served by Vite's middleware in dev and copied into the build output
	const publicDir = path.resolve(site.root, "src/public");
	if (existsSync(publicDir)) {
		config.publicDir = publicDir;
	}
	// Resolve tsconfig path aliases (e.g. `@/*`). Previously provided by the
	// default `vite-tsconfig-paths` plugin on Site; vite-plus handles it inline
	config.resolve ??= {};
	config.resolve.tsconfigPaths ??= true;
	// When the framework itself is linked into the app (workspace/link:
	// installs), resolve `@torpor/view` and `@torpor/build/dev` from source via
	// their `torpor:source` export conditions, so framework changes take effect
	// without rebuilding dist. Registry installs run the compiled dist.
	//
	// Note: this must be a custom condition, not Vite's built-in `development`
	// one — Vite's dev server activates `development` by default, which made
	// registry installs resolve the unpublished `src/` files and fail.
	const sourceMode = detectSourceMode(site.root);
	if (sourceMode) {
		config.resolve.conditions ??= [];
		config.resolve.conditions.push("torpor:source");
	}
	// vite-plus' `tsconfigPaths` isn't honored by the SSR module-runner's
	// externalization path (it hardcodes tsconfigPaths:false), so dev SSR can't
	// resolve path aliases. Mirror tsconfig `compilerOptions.paths` as Vite
	// `resolve.alias` so they resolve during transform for both client and SSR.
	config.resolve.alias = [...asAliasArray(config.resolve.alias), ...tsconfigAliases(site.root)];

	// The adapter provides the dev-runtime plugin(s); fall back to the
	// framework's Node-runtime plugin when it doesn't.
	const adapterDev = site.adapter.dev?.(site);
	const devPlugins = normalizePlugins(adapterDev ?? devPlugin(site, sourceMode));

	config.plugins = [
		manifest(site, true),
		torpor({ dev: true }),
		...devPlugins,
		...site.vitePlugins,
	];

	// HACK: To be able to import `.torp` files from barrel files in
	// node_modules, we need to add their libraries to `ssr.noExternal` in
	// site.config.ts, and let the dep optimizer know how to compile them
	// here. The optimizer is a rolldown build, so it needs a rolldown-shaped
	// plugin (the vite export) -- an esbuild-shaped one is silently ignored
	config.optimizeDeps ??= {};
	config.optimizeDeps.extensions ??= [];
	config.optimizeDeps.extensions.push(".torp");
	config.optimizeDeps.rolldownOptions ??= {};
	config.optimizeDeps.rolldownOptions.plugins ??= [torpor()];

	// Packages that ship `.torp` files (e.g. icon libraries) need the torpor
	// compiler: dep optimization would parse them as plain JavaScript and
	// fail, and SSR externalization would leave raw `.torp` imports that
	// Node/workerd can't load. Exclude them from optimization and mark them
	// for SSR bundling so they go through the torpor plugin
	addTorporPackageConfig(site.root, config);

	// Workspace packages may have been rebuilt since the last dev run; drop
	// Vite's dep cache so SSR never executes stale prebundled modules
	clearStaleDepCache(site.root, (message) => console.log(`\n${message}`));

	// A workspace package with dist .torp copies (e.g. @torpor/ui) whose src
	// changed without a rebuild serves OLD components to the site, silently;
	// report the drift so it can be fixed with a rebuild
	reportStaleTorpCopies(site.root, (message) => console.log(`\n${message}`));

	// Load environment variables from a `.env` file, with defaults if not set
	configDotenv();

	process.env.PROTOCOL ??= "http:";
	process.env.HOST ??= "localhost";
	process.env.PORT ??= "7059";

	// Honor PORT (env or .env) for the dev server port, matching --preview;
	// fall back to the default when it doesn't parse to a number
	const envPort = parseInt(process.env.PORT);
	if (!Number.isNaN(envPort)) {
		config.server.port ??= envPort;
	}

	const connectingUrl = `${process.env.PROTOCOL}//${process.env.HOST}:${process.env.PORT}`;
	console.log(`\nConnecting to ${connectingUrl}`);

	const vite = await createViteServer(config);

	// Load the SSR entry once before binding the listener: it triggers Vite's
	// first dependency optimization, which otherwise settles down (reloading
	// the server) right after "Listening on ..." -- dropping any request in
	// flight at that moment, so clients see an empty reply
	await warmServerEntry(vite, site, sourceMode);

	await vite.listen();

	watchRoutes(site, vite, configVite);

	const listeningUrl = vite.resolvedUrls?.local?.[0] ?? connectingUrl;
	console.log(`Listening on ${listeningUrl}\n`);
}

/**
 * Loads the SSR entry so the first dependency optimization (and any
 * optimizer-driven server reload) happens before the listener is bound,
 * rather than on the first real request.
 */
async function warmServerEntry(
	vite: ViteDevServer,
	site: Site,
	sourceMode: boolean,
): Promise<void> {
	try {
		const { serverEntry } = siteEntryPaths(site.root, sourceMode);
		await vite.ssrLoadModule(serverEntry);
	} catch (e) {
		// Never block startup over warmup -- the first real request surfaces
		// errors as before
		if (process.env.TORPOR_DEBUG_WARMUP) throw e;
	}
}

/**
 * Reports route type issues at startup, then re-checks route files and
 * `makeApi` calls as they change so annotation problems surface during
 * development without failing the dev server.
 *
 * Also watches the config's import graph and the registered route folders,
 * re-loading the site config when route definitions change (edits to
 * `site.config.ts` or a `routes.ts` it imports) or when route files are added
 * or removed. The re-loaded state is swapped onto the live site, the generated
 * manifest invalidated, and a full client reload triggered, so the running
 * server picks up the change without a restart.
 */
function watchRoutes(site: Site, vite: ViteDevServer, configVite?: ViteDevServer): void {
	reportRouteIssues(checkRoutes(site));
	reportRouteIssues(checkApiCalls(site));
	reportRouteIssues(checkLayoutSlots(site));

	// Map absolute route file paths to their manifest entries, so changed
	// files can be re-checked against their derived route. Layout route files
	// are included for their slot check (a .torp layout is its own component)
	const buildRouteFiles = (): Map<string, (typeof site.routes)[number]> =>
		new Map(
			site.routes
				.filter(
					(r) => r.file?.endsWith(".ts") || (r.file?.endsWith(".torp") && r.type === LAYOUT_ROUTE),
				)
				.map((r) => [path.resolve(site.root, r.file!), r]),
		);
	let routeFiles = buildRouteFiles();
	const apiCheck = createApiCallCheck(site);
	// Only report when a file's issues change, to avoid repeating the same
	// warnings on every save
	const reported = new Map<string, string>();

	const report = (file: string, issues: RouteCheckIssue[]) => {
		const key = JSON.stringify(issues);
		if (reported.get(file) === key) return;
		reported.set(file, key);
		reportRouteIssues(issues);
	};

	const recheck = (file: string): void => {
		const route = routeFiles.get(file);
		if (route) {
			report(
				file,
				route.type === LAYOUT_ROUTE ? checkLayoutSlot(site, route) : checkRoute(site, route),
			);
			return;
		}
		if (!/\.(ts|js|torp)$/.test(file)) return;
		let source: string;
		try {
			source = readFileSync(file, "utf8");
		} catch {
			return;
		}
		report(file, checkApiCallSource(source, file, apiCheck));
	};

	// Files that affect the route table: the config's import graph (addRoute
	// definitions, plugins, inline endpoints) and the route folders (route
	// files are read from disk by addRouteFolder, not imported). Recomputed
	// after each reload, since the config may start importing new files.
	let configDeps =
		configVite && site.configFile
			? configDependencyFiles(configVite, site.root)
			: new Set<string>();
	const inRouteFolder = (file: string): boolean =>
		site.routeFolders.some((f) => isInside(path.resolve(site.root, f.folder), file));

	// Re-load the site config and swap its route state onto the live site.
	// Serialized so concurrent add/unlink events (e.g. a folder rename) can't
	// interleave, and guarded so a bad config save doesn't crash the server
	let pending = Promise.resolve();
	const reload = (): void => {
		if (!site.configFile) return;
		pending = pending
			.then(async () => {
				// Load the config on a fresh server rather than re-loading it
				// through the one that first read it: doing that from inside
				// its own watcher cycle deadlocks
				const { site: fresh, vite: freshVite } = await loadSite(site.root);
				try {
					configDeps = configDependencyFiles(freshVite, site.root);
					if (!site.applyRouteState(fresh)) return;
				} finally {
					await freshVite.close();
				}
				routeFiles = buildRouteFiles();
				reportRouteIssues(checkRoutes(site));
				reportRouteIssues(checkApiCalls(site));
				reportRouteIssues(checkLayoutSlots(site));
				invalidateManifest(vite);
				vite.ws.send({ type: "full-reload", path: "*" });
			})
			.catch((e) => console.error(e));
	};

	// Route-file edits are `change` events and are handled by `recheck`/HMR
	// (the route path is derived from the filename, so an edit doesn't change
	// the route table); only file-set events and config-dependency edits need
	// a reload
	vite.watcher.on("change", (file) => {
		recheck(file);
		if (configDeps.has(file)) reload();
	});
	vite.watcher.on("add", (file) => {
		recheck(file);
		if (configDeps.has(file) || inRouteFolder(file)) reload();
	});
	const onRemove = (file: string) => {
		if (configDeps.has(file) || inRouteFolder(file)) reload();
	};
	vite.watcher.on("unlink", onRemove);
	vite.watcher.on("addDir", onRemove);
	vite.watcher.on("unlinkDir", onRemove);
}

function isInside(dir: string, file: string): boolean {
	const rel = path.relative(dir, file);
	return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/**
 * Invalidates the generated `@torpor/build/manifest` module in every
 * environment, so the server entry re-runs with the rebuilt route table on the
 * next request and the client gets the new manifest on reload.
 */
function invalidateManifest(vite: ViteDevServer): void {
	for (const env of Object.values(vite.environments)) {
		const mod = env.moduleGraph.getModuleById(MANIFEST_MODULE_ID);
		if (mod) env.moduleGraph.invalidateModule(mod);
	}
}

function normalizePlugins(plugins: Plugin | Plugin[] | void): Plugin[] {
	if (!plugins) return [];
	return Array.isArray(plugins) ? plugins : [plugins];
}

function asAliasArray(alias: AliasOptions | undefined): AliasEntry[] {
	// Normalize an existing `resolve.alias` value (array | object | undefined)
	// into an array so we can concatenate our tsconfig-derived aliases.
	if (!alias) return [];
	if (Array.isArray(alias)) return alias;
	return Object.entries(alias).map(([find, replacement]) => ({ find, replacement }));
}
