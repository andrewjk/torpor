import { realpathSync } from "node:fs";
import path from "node:path";

/**
 * Paths to the site entry files that `tb` loads from the installed
 * `@torpor/build` package, in either source (linked framework) or dist
 * (registry install) mode.
 */
export type SiteEntryPaths = {
	serverEntry: string;
	clientEntry: string;
	clientDevEntry: string;
};

/**
 * Whether tb should run the framework from its TypeScript source instead of
 * its compiled dist. This is a framework-development convenience: registry
 * installs always run dist. Source mode is enabled explicitly via the
 * TORPOR_SOURCE_DEV env var, or automatically when both `@torpor/build` and
 * `@torpor/view` are symlinked into the app from outside node_modules (as
 * workspace links and `link:` overrides do). Both packages must be linked,
 * because source mode resolves their `torpor:source` export conditions, which
 * point at src files that registry installs don't ship.
 */
export function detectSourceMode(siteRoot: string): boolean {
	if (process.env.TORPOR_SOURCE_DEV) return true;
	const packages = ["@torpor/build", "@torpor/view"];
	return packages.every((pkg) => {
		try {
			const dist = path.resolve(siteRoot, "node_modules", pkg, "dist/index.mjs");
			const real = realpathSync(dist);
			return !real.includes("node_modules");
		} catch {
			return false;
		}
	});
}

/**
 * The site entry files for the given mode: raw TypeScript sources when the
 * framework is linked (Vite transforms them, and edits show up without a
 * rebuild), compiled `.mjs` bundles for registry installs.
 */
export function siteEntryPaths(siteRoot: string, sourceMode: boolean): SiteEntryPaths {
	const folder = path.resolve(
		siteRoot,
		"node_modules/@torpor/build",
		sourceMode ? "src/site" : "dist",
	);
	const ext = sourceMode ? ".ts" : ".mjs";
	return {
		serverEntry: path.join(folder, `serverEntry${ext}`),
		clientEntry: path.join(folder, `clientEntry${ext}`),
		clientDevEntry: path.join(folder, `clientEntryDev${ext}`),
	};
}

/**
 * The torpor `Server` class module that a Cloudflare `_worker.ts` imports,
 * for the given mode.
 */
export function serverClassPath(siteRoot: string, sourceMode: boolean): string {
	return path.resolve(
		siteRoot,
		"node_modules/@torpor/build",
		sourceMode ? "src/server/Server.ts" : "dist/server/Server.mjs",
	);
}
