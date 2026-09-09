import type Server from "../server/Server";
import type Adapter from "../types/Adapter";

/**
 * The known adapter packages, in preference order, with the platform env
 * markers that select them when the site is built in a deployment
 * environment. Only packages that are actually installed (somewhere in the
 * site's node_modules) can be resolved.
 */
const ADAPTER_PACKAGES = [
	{
		// The preferred fallback: a node server runs anywhere
		pkg: "@torpor/adapter-node",
		platforms: [] as string[],
	},
	{
		pkg: "@torpor/adapter-cloudflare",
		// Set when building in a Cloudflare Pages environment. More markers
		// can be added as adapters are (e.g. `VERCEL` for an adapter-vercel)
		platforms: ["CF_PAGES"],
	},
];

/**
 * Loads an adapter package, returning undefined when it isn't installed.
 * The import deliberately uses a variable specifier so that bundlers never
 * try to resolve adapter packages from @torpor/build.
 */
async function loadAdapterPackage(pkg: string): Promise<Adapter | undefined> {
	try {
		return (await import(/* @vite-ignore */ pkg)).default;
	} catch {
		return undefined;
	}
}

export type AdapterResolution = {
	/** The resolved adapter, or undefined when none could be found */
	adapter: Adapter | undefined;
	/** The package the adapter was resolved from */
	pkg: string | undefined;
	/** Why the adapter was chosen, for logging */
	reason: string;
};

export type ResolveAdapterOptions = {
	/** The environment to check for platform markers (defaults to process.env) */
	env?: Record<string, string | undefined>;
	/** Loads an adapter package by name (defaults to a dynamic import) */
	load?: (pkg: string) => Promise<Adapter | undefined>;
};

/**
 * Finds an adapter to use when the site doesn't set one explicitly:
 *
 * 1. A platform build environment (e.g. `CF_PAGES` for Cloudflare Pages)
 *    selects its adapter, when the adapter package is installed.
 * 2. Otherwise an installed adapter is used, preferring `adapter-node`
 *    (a node server runs anywhere).
 * 3. Otherwise nothing is found, and the caller decides what to do (warn,
 *    or serve on the current runtime).
 */
export async function resolveAdapter(
	options: ResolveAdapterOptions = {},
): Promise<AdapterResolution> {
	const env = options.env ?? process.env;
	const load = options.load ?? loadAdapterPackage;

	// Import each package at most once
	const loaded = new Map<string, Adapter | undefined>();
	const loadOnce = async (pkg: string) => {
		if (!loaded.has(pkg)) loaded.set(pkg, await load(pkg));
		return loaded.get(pkg);
	};

	// 1. A deployment environment selects its adapter
	for (const candidate of ADAPTER_PACKAGES) {
		for (const marker of candidate.platforms) {
			if (env[marker] === undefined) continue;
			const adapter = await loadOnce(candidate.pkg);
			if (adapter) {
				return { adapter, pkg: candidate.pkg, reason: `${marker} detected` };
			}
		}
	}

	// 2. An installed adapter (the list is in preference order)
	for (const candidate of ADAPTER_PACKAGES) {
		const adapter = await loadOnce(candidate.pkg);
		if (adapter) {
			return { adapter, pkg: candidate.pkg, reason: "installed" };
		}
	}

	return { adapter: undefined, pkg: undefined, reason: "none found" };
}

/**
 * The current runtime, when preview can serve a fetch handler without an
 * adapter package. (Node's request conversion lives in adapter-node, so
 * node is deliberately not handled here.)
 */
function currentRuntime(): "bun" | "deno" | undefined {
	const global = globalThis as any;
	if (global.Bun) return "bun";
	if (global.Deno) return "deno";
	return undefined;
}

/**
 * Serves the built output on the current runtime, for when no adapter
 * package could be found. Returns false when the runtime isn't supported.
 */
function serveOnCurrentRuntime(server: Server): boolean {
	const runtime = currentRuntime();
	if (!runtime) return false;

	const global = globalThis as any;
	const port = parseInt(process.env.PORT ?? "7059");
	const hostname = process.env.HOST ?? "localhost";
	console.log(`[torpor] Serving on the ${runtime} runtime at ${hostname}:${port}`);

	if (runtime === "bun") {
		global.Bun.serve({ port, hostname, fetch: (req: Request) => server.fetch(req) });
	} else {
		global.Deno.serve({ port, hostname }, (req: Request) => server.fetch(req));
	}
	return true;
}

// The resolution is cached per process, and the "Using ..." message is only
// logged once
let cache: Promise<AdapterResolution> | undefined;
let loggedPkg: string | undefined;

function getCachedResolution(): Promise<AdapterResolution> {
	return (cache ??= resolveAdapter());
}

function logAdapter(pkg: string, reason: string): void {
	if (loggedPkg === pkg) return;
	loggedPkg = pkg;
	console.log(`[torpor] Using the ${pkg.replace("@torpor/adapter-", "")} adapter (${reason})`);
}

/**
 * The adapter used when the site doesn't set one explicitly. Rather than
 * being a real adapter, it resolves one at the time it's needed (see
 * `resolveAdapter`), and as a last resort serves the built output on the
 * current runtime -- Bun and Deno can serve a fetch handler natively, while
 * node needs `@torpor/adapter-node`.
 *
 * Dev mode is not affected: with no `dev` hook, the framework's default
 * Node-runtime dev plugin is used.
 */
const defaultAdapter: Adapter = {
	async serve(server, site) {
		const { adapter, pkg, reason } = await getCachedResolution();
		if (adapter && pkg) {
			logAdapter(pkg, reason);
			await adapter.serve(server, site);
			return;
		}
		if (serveOnCurrentRuntime(server)) return;
		console.log(
			"[torpor] No adapter found -- install one (e.g. `pnpm add @torpor/adapter-node`) or set `site.adapter` in site.config.ts",
		);
	},
	async prebuild(site) {
		const { adapter, pkg, reason } = await getCachedResolution();
		if (!adapter || !pkg) return;
		logAdapter(pkg, reason);
		await adapter.prebuild?.(site);
	},
	async postbuild(site) {
		const { adapter, pkg, reason } = await getCachedResolution();
		if (!adapter || !pkg) return;
		logAdapter(pkg, reason);
		await adapter.postbuild?.(site);
	},
};

export default defaultAdapter;
