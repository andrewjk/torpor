import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const watch = process.argv.includes("--watch");
const pack = process.argv.includes("--pack");

/**
 * Copies the TextMate grammar from the @torpor/textmate package into the
 * syntaxes folder, so that the extension always uses the same grammar as the
 * website and other tooling.
 */
function syncGrammar() {
	const grammarUrl = import.meta.resolve("@torpor/textmate/grammar.json");
	const grammar = fs.readFileSync(fileURLToPath(grammarUrl), "utf8");

	fs.mkdirSync(path.join(root, "syntaxes"), { recursive: true });
	fs.writeFileSync(path.join(root, "syntaxes/torpor.tmLanguage.json"), grammar);
}

/**
 * Copies the typescript package into dist/node_modules, so that it can be
 * resolved at runtime by the language server (which keeps it as an external).
 * Only the files needed at runtime are copied, to keep the extension small.
 */
function copyTypeScript() {
	const source = path.join(root, "node_modules/typescript");
	const target = path.join(root, "dist/node_modules/typescript");

	fs.cpSync(source, target, {
		dereference: true,
		recursive: true,
		filter: (file) => {
			if (file === source) {
				return true;
			}
			const relative = path.relative(source, file);
			if (relative === "package.json") {
				return true;
			}
			return relative.startsWith("lib") && !relative.endsWith(".map");
		},
	});
}

/**
 * Bundles the extension client and language server into dist, keeping
 * typescript as an external (it needs to read its own lib .d.ts files from
 * disk at runtime, via @typescript/vfs).
 *
 * The "module" main field is preferred, so that packages with UMD builds
 * (e.g. vscode-css-languageservice) resolve to their ESM versions -- the UMD
 * builds shadow the Node require and cannot be bundled properly.
 */
const clientOptions: esbuild.BuildOptions = {
	absWorkingDir: root,
	entryPoints: ["client/src/extension.ts"],
	outfile: "dist/client.js",
	bundle: true,
	format: "cjs",
	platform: "node",
	target: "node20",
	sourcemap: true,
	external: ["vscode"],
	mainFields: ["module", "main"],
	logLevel: "info",
};

const serverOptions: esbuild.BuildOptions = {
	absWorkingDir: root,
	entryPoints: ["server/src/server.ts"],
	outfile: "dist/server.js",
	bundle: true,
	format: "cjs",
	platform: "node",
	target: "node20",
	sourcemap: true,
	external: ["typescript"],
	mainFields: ["module", "main"],
	logLevel: "info",
};

syncGrammar();

async function main() {
	if (watch) {
		const contexts = await Promise.all([
			esbuild.context(clientOptions),
			esbuild.context(serverOptions),
		]);
		await Promise.all(contexts.map((context) => context.watch()));
		console.log("[watch] build finished");
	} else {
		await Promise.all([esbuild.build(clientOptions), esbuild.build(serverOptions)]);
		if (pack) {
			copyTypeScript();
		}
	}
}

void main();
