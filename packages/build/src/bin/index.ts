#! /usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { transformWithEsbuild } from "vite";
import Site from "../site/Site";
import runBuild from "../site/runBuild";
import runDev from "../site/runDev";

run();

async function run() {
	// Look for and load a site.config.js/ts file in the working directory
	const workingDir = process.cwd();
	let configFile = "";
	const jsConfigFile = path.join(workingDir, "site.config.js");
	const tsConfigFile = path.join(workingDir, "site.config.ts");
	if (fs.existsSync(jsConfigFile)) {
		// If it's JS, we can just import it straight up
		configFile = jsConfigFile;
	} else if (fs.existsSync(tsConfigFile)) {
		// If it's TS, we need to convert it to JS
		// TODO: Put the generated file somewhere better (dist?)
		configFile = path.join(workingDir, "site.config.out.js");
		let source = (
			await transformWithEsbuild(fs.readFileSync(tsConfigFile, "utf-8"), tsConfigFile, {
				loader: "ts",
			})
		).code;
		fs.writeFileSync(configFile, source);
	} else {
		throw new Error("site.config file not found");
	}

	const site = (await import(configFile)).default as Site;
	if (!site || !site.root || !site.routes) {
		throw new Error("Invalid site in config file");
	}

	if (process.argv.includes("--dev")) {
		await runDev(site);
	} else if (process.argv.includes("--build")) {
		await runBuild(site);
	}
}
