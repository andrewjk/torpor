import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsFolder = dirname(fileURLToPath(import.meta.url));
const srcFolder = resolve(scriptsFolder, "../src");
const grammarFile = join(srcFolder, "grammar.json");
const outputFile = join(srcFolder, "index.ts");

const grammar = readFileSync(grammarFile, "utf8")
	.replaceAll(/\s/g, "")
	.replaceAll("\\", "\\\\")
	.replaceAll("'", "\\'");

const code = `
import typescript from "./typescript";

const lang = Object.freeze(JSON.parse('${grammar}'));

export default [
	...typescript,
	lang
] satisfies any[] as any[];`.trimStart();

writeFileSync(outputFile, code, "utf-8");
