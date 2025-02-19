#! /usr/bin/env node
//import { existsSync, promises as fs } from "node:fs";
import fs from "node:fs";
import path from "path";
import defineConfig from "../site/defineConfig";
import type UserConfig from "../types/UserConfig";

// Check for a torpor.config.js/ts file in the working directory
// TODO: Make sure it's valid, try/catch, etc
// TODO: There has GOT to be an easier way
let options: UserConfig | undefined;
const workingDir = process.cwd();
const jsConfigFile = path.join(workingDir, "torpor.config.js");
const tsConfigFile = path.join(workingDir, "torpor.config.ts");
let source: string | undefined;
if (fs.existsSync(jsConfigFile)) {
	//const configFile = path.relative(".", tsConfigFile);
	//options = await import(configFile);
	source = fs.readFileSync(jsConfigFile, "utf8");
	source = source
		.replace(
			/import\s+\{\s+defineConfig\s+\}\s+from\s+["']@torpor\/build["']/,
			"const defineConfig = (x) => x",
		)
		.replace("export default", "");
} else if (fs.existsSync(tsConfigFile)) {
	console.log("TS config file is not supported");
}

if (source) {
	options = eval(source);
}

defineConfig(options);

// This already gets done in vinxi.createApp so we can't do it twice
//const app = defineConfig(options);
//if (process.argv.includes("--dev")) {
//	await app.dev();
//} else if (process.argv.includes("--build")) {
//	await app.build();
//}
