import fs from "node:fs";
import path from "node:path";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import Site from "../site/Site";
import runBuild from "./runBuild";
import runDev from "./runDev";
import runPreview from "./runPreview";

/**
 * Looks for and loads a site.config.js/ts file in the working directory,
 * running the site's plugins. The Vite server used to load the config is
 * returned as well, so that (for example) route files can be loaded through
 * it; callers are responsible for closing it.
 */
export async function loadSite(folder: string): Promise<{ site: Site; vite: ViteDevServer }> {
	// Look for and load a site.config.js/ts file in the working directory
	const jsConfigFile = path.join(folder, "site.config.js");
	const tsConfigFile = path.join(folder, "site.config.ts");
	let configFile = "";
	if (fs.existsSync(jsConfigFile)) {
		configFile = jsConfigFile;
	} else if (fs.existsSync(tsConfigFile)) {
		configFile = tsConfigFile;
	} else {
		throw new Error("site.config file not found");
	}

	// Use a temporary Vite server to load the config, so that local TS imports
	// (e.g. a routes.ts file) and path aliases are resolved correctly
	const vite = await createViteServer({
		server: { middlewareMode: true },
		appType: "custom",
		resolve: { tsconfigPaths: true },
		optimizeDeps: { noDiscovery: true },
	});
	try {
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

		return { site, vite };
	} catch (error) {
		await vite.close();
		throw error;
	}
}

export default async function run(
	folder: string,
	mode: "dev" | "build" | "preview",
): Promise<void> {
	const { site, vite } = await loadSite(folder);
	try {
		switch (mode) {
			case "dev": {
				await runDev(site);
				break;
			}
			case "build": {
				await runBuild(site);
				break;
			}
			case "preview": {
				await runPreview(site);
				break;
			}
			default: {
				console.log("No mode passed, running in dev");
				await runDev(site);
				break;
			}
		}
	} finally {
		await vite.close();
	}
}
