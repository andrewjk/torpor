import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsFolder = dirname(fileURLToPath(import.meta.url));
const srcFolder = resolve(scriptsFolder, "../src");
const grammarFile = join(srcFolder, "grammar.json");
const outputFile = join(srcFolder, "index.ts");

// Minify with JSON.stringify (not whitespace stripping), since whitespace
// inside string values is meaningful -- e.g. injection selectors like
// "L:source.torp - comment - style.group.torp".
const grammar = JSON.stringify(JSON.parse(readFileSync(grammarFile, "utf8")))
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
