import estorpor from "@torpor/unplugin/esbuild";
import torpor from "@torpor/unplugin/vite";
import { configDotenv } from "dotenv";
import { readFileSync } from "node:fs";
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
import manifest from "../site/manifest.ts";
import { checkLayoutSlot, checkLayoutSlots } from "../site/checkLayoutSlots";
import { LAYOUT_ROUTE } from "../types/RouteType";
import tsconfigAliases, { type AliasEntry } from "../utils/tsconfigAliases";
import { addTorporPackageConfig } from "../utils/torporPackages";
import { detectSourceMode } from "../utils/entryPaths";
import devPlugin from "./devPlugin.ts";
import { clearStaleDepCache } from "./depCache";
import { reportStaleTorpCopies } from "./staleTorpCopies";

export default async function runDev(site: Site): Promise<void> {
	// Create the Vite dev server. Unlike the previous middleware-mode setup, we
	// let Vite own the HTTP server (so HMR/websockets work natively) and let the
	// adapter's `dev()` plugin(s) handle SSR via configureServer.
	const config = structuredClone(site.viteConfig ?? {});
	config.appType = "custom";
	config.server ??= {};
	config.server.host ??= "localhost";
	config.server.port ??= 7059;
	// Resolve tsconfig path aliases (e.g. `@/*`). Previously provided by the
	// default `vite-tsconfig-paths` plugin on Site; vite-plus handles it inline
	config.resolve ??= {};
	config.resolve.tsconfigPaths ??= true;
	// When the framework itself is linked into the app (workspace/link:
	// installs), resolve `@torpor/view` and `@torpor/build/dev` from source via
	// their `development` export conditions, so framework changes take effect
	// without rebuilding dist. Registry installs run the compiled dist.
	const sourceMode = detectSourceMode(site.root);
	if (sourceMode) {
		config.resolve.conditions ??= [];
		config.resolve.conditions.push("development");
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
	// site.config.ts, and let esbuild know how to compile them here
	config.optimizeDeps ??= {};
	config.optimizeDeps.extensions ??= [];
	config.optimizeDeps.extensions.push(".torp");
	config.optimizeDeps.rolldownOptions ??= {};
	config.optimizeDeps.rolldownOptions.plugins ??= [estorpor()];
	// TODO: config.optimizeDeps.rolldownOptions.plugins.push(estorpor());

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

	const connectingUrl = `${process.env.PROTOCOL}//${process.env.HOST}:${process.env.PORT}`;
	console.log(`\nConnecting to ${connectingUrl}`);

	const vite = await createViteServer(config);
	await vite.listen();

	watchRouteTypes(site, vite);

	const listeningUrl = vite.resolvedUrls?.local?.[0] ?? connectingUrl;
	console.log(`Listening on ${listeningUrl}\n`);
}

/**
 * Reports route type issues at startup, then re-checks route files and
 * `makeApi` calls as they change so annotation problems surface during
 * development without failing the dev server.
 */
function watchRouteTypes(site: Site, vite: ViteDevServer): void {
	reportRouteIssues(checkRoutes(site));
	reportRouteIssues(checkApiCalls(site));
	reportRouteIssues(checkLayoutSlots(site));

	// Map absolute route file paths to their manifest entries, so changed
	// files can be re-checked against their derived route. Layout route files
	// are included for their slot check (a .torp layout is its own component)
	const routeFiles = new Map(
		site.routes
			.filter(
				(r) => r.file?.endsWith(".ts") || (r.file?.endsWith(".torp") && r.type === LAYOUT_ROUTE),
			)
			.map((r) => [path.resolve(site.root, r.file!), r]),
	);
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

	vite.watcher.on("change", recheck);
	vite.watcher.on("add", recheck);
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
