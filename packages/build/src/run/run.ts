import fs from "node:fs";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import Site from "../site/Site";
import runBuild from "./runBuild";
import runDev from "./runDev";
import runPreview from "./runPreview";

export default async function run(
	folder: string,
	mode: "dev" | "build" | "preview",
): Promise<void> {
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
	let site: Site;
	try {
		site = (await vite.ssrLoadModule(configFile)).default as Site;
		site.configFile = configFile;
	} finally {
		await vite.close();
	}

	if (!site || !site.root || !site.routes) {
		throw new Error("Invalid site in config file");
	}

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
}
