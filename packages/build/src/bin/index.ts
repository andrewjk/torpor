#! /usr/bin/env node
//import { existsSync, promises as fs } from "node:fs";
import fs from "node:fs";
import path from "node:path";
import { transformWithEsbuild } from "vite";
//import tsb from "ts-blank-space";
import App from "../app/App";
import runDev from "../app/runDev";

//import defineConfig from "../site/defineConfig";
//import type UserConfig from "../types/UserConfig";

run();

async function run() {
	// Check for a torpor.config.js/ts file in the working directory
	// TODO: Make sure it's valid, try/catch, etc
	// TODO: There has GOT to be an easier way
	//let options: UserConfig | undefined;
	const workingDir = process.cwd();
	let configFile = "";
	const jsConfigFile = path.join(workingDir, "site.config.js");
	const tsConfigFile = path.join(workingDir, "site.config.ts");
	//let source: string | undefined;
	if (fs.existsSync(jsConfigFile)) {
		configFile = jsConfigFile;
		////const configFile = path.relative(".", tsConfigFile);
		////options = await import(configFile);
		//source = fs.readFileSync(jsConfigFile, "utf8");
		//source = source
		//	.replace(
		//		/import\s+\{\s+defineConfig\s+\}\s+from\s+["']@torpor\/build["']/,
		//		"const defineConfig = (x) => x",
		//	)
		//	.replace("export default", "");
	} else if (fs.existsSync(tsConfigFile)) {
		configFile = path.join(workingDir, "site.config.out.js");
		//let source = tsb(fs.readFileSync(configFile, "utf-8"));
		let source = (
			await transformWithEsbuild(fs.readFileSync(tsConfigFile, "utf-8"), tsConfigFile, {
				loader: "ts",
			})
		).code;
		fs.writeFileSync(configFile, source);
	}

	const app = (await import(configFile)).default as App;
	if (!app || !app.root || !app.routes) {
		throw new Error("Invalid app in config");
	}

	if (process.argv.includes("--dev")) {
		await runDev(app);
	} else if (process.argv.includes("--build")) {
		//await app.build();
	}
}

//if (source) {
//	options = eval(source);
//}

//defineConfig(options);

// This already gets done in vinxi.createApp so we can't do it twice
//const app = defineConfig(options);
//if (process.argv.includes("--dev")) {
//	await app.dev();
//} else if (process.argv.includes("--build")) {
//	await app.build();
//}
