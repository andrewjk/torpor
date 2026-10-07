import fs from "node:fs";
import path from "node:path";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import Site from "../site/Site";

/**
 * Finds the site.config.js/ts file in the given folder.
 */
export function findConfigFile(folder: string): string {
	const jsConfigFile = path.join(folder, "site.config.js");
	const tsConfigFile = path.join(folder, "site.config.ts");
	if (fs.existsSync(jsConfigFile)) return jsConfigFile;
	if (fs.existsSync(tsConfigFile)) return tsConfigFile;
	throw new Error("site.config file not found");
}

/**
 * Creates the temporary Vite server used to load the site config, so that
 * local TS imports (e.g. a routes.ts file) and path aliases are resolved
 * correctly. Kept separate from the app's dev server: the config is loaded
 * before that server exists.
 */
export function createConfigVite(): Promise<ViteDevServer> {
	return createViteServer({
		server: { middlewareMode: true },
		appType: "custom",
		resolve: { tsconfigPaths: true },
		optimizeDeps: { noDiscovery: true },
	});
}

/**
 * Loads (or, when the config module has been invalidated, re-loads) the site
 * config through an existing config Vite server and runs its plugins.
 */
export async function loadSiteFromVite(vite: ViteDevServer, configFile: string): Promise<Site> {
	const site = (await vite.ssrLoadModule(configFile)).default as Site;
	site.configFile = configFile;

	if (!site || !site.root || !site.routes) {
		throw new Error("Invalid site in config file");
	}

	// Run the site's plugins. The manifest plugin also runs them when the
	// server starts up (dev SSR and production), so that plugin routes are
	// registered in the runtime as well
	for (const plugin of site.plugins) {
		await plugin(site);
	}

	return site;
}

/**
 * Looks for and loads a site.config.js/ts file in the working directory,
 * running the site's plugins. The Vite server used to load the config is
 * returned as well, so that (for example) route files can be loaded through
 * it; callers are responsible for closing it.
 */
export async function loadSite(folder: string): Promise<{ site: Site; vite: ViteDevServer }> {
	const configFile = findConfigFile(folder);

	const vite = await createConfigVite();
	try {
		const site = await loadSiteFromVite(vite, configFile);
		return { site, vite };
	} catch (error) {
		await vite.close();
		throw error;
	}
}

/**
 * The site-root files the config depends on -- the config itself and any
 * modules it imports (e.g. a `routes.ts` that calls `addRoute`). The dev
 * server watches these so route changes defined in code are picked up, not
 * just edits to `site.config.ts` itself.
 */
export function configDependencyFiles(vite: ViteDevServer, root: string): Set<string> {
	const files = new Set<string>();
	const graph = vite.environments.ssr.moduleGraph;
	for (const mod of graph.idToModuleMap.values()) {
		if (mod.file && isInside(root, mod.file)) {
			files.add(mod.file);
		}
	}
	return files;
}

function isInside(dir: string, file: string): boolean {
	const rel = path.relative(dir, file);
	return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}
