import fs from "node:fs";
import path from "node:path";
import { transformWithEsbuild } from "vite";
import Site from "./Site";
import runBuild from "./runBuild";
import runDev from "./runDev";
import runPreview from "./runPreview";

export default async function run(
	folder: string,
	mode: "dev" | "build" | "preview",
): Promise<void> {
	// Look for and load a site.config.js/ts file in the working directory
	let configFile = "";
	let deleteConfigFile = false;
	const jsConfigFile = path.join(folder, "site.config.js");
	const tsConfigFile = path.join(folder, "site.config.ts");
	if (fs.existsSync(jsConfigFile)) {
		// If it's JS, we can just import it straight up
		configFile = jsConfigFile;
	} else if (fs.existsSync(tsConfigFile)) {
		// If it's TS, we need to convert it to JS
		// TODO: Put the generated file somewhere better (dist?)
		configFile = path.join(folder, "site.config.temp.js");
		let source = (
			await transformWithEsbuild(fs.readFileSync(tsConfigFile, "utf-8"), tsConfigFile, {
				loader: "ts",
			})
		).code;
		fs.writeFileSync(configFile, source);
		deleteConfigFile = true;
	} else {
		throw new Error("site.config file not found");
	}

	const site = (await import(configFile)).default as Site;
	if (!site || !site.root || !site.routes) {
		throw new Error("Invalid site in config file");
	}
	if (deleteConfigFile) {
		fs.rmSync(configFile);
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
