#! /usr/bin/env node
//import { existsSync, promises as fs } from "node:fs";
import fs from "node:fs";
import path from "path";
import defineSite from "../site/defineSite";
import type UserConfig from "../types/UserConfig";

// Check for a tera.config.js/ts file in the working directory
// TODO: Make sure it's valid, try/catch, etc
// TODO: There has GOT to be an easier way
let options: UserConfig | undefined;
const workingDir = process.cwd();
const jsConfigFile = path.join(workingDir, "tera.config.js");
const tsConfigFile = path.join(workingDir, "tera.config.ts");
let source: string | undefined;
if (fs.existsSync(jsConfigFile)) {
	//const configFile = path.relative(".", tsConfigFile);
	//options = await import(configFile);
	source = fs.readFileSync(jsConfigFile, "utf8");
	source = source
		.replace(
			/import\s+\{\s+defineConfig\s+\}\s+from\s+["']@tera\/kit["']/,
			"const defineConfig = (x) => x",
		)
		.replace("export default", "");
} else if (fs.existsSync(tsConfigFile)) {
	console.log("TS config file is not supported");
}

if (source) {
	options = eval(source);
}

const app = defineSite(options);

// This already gets done in vinxi.createApp so we can't do it twice
//if (process.argv.includes("--dev")) {
//	await app.dev();
//} else if (process.argv.includes("--build")) {
//	await app.build();
//}
