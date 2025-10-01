import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import ts from "typescript";
import { TextDocument } from "vscode-languageserver-textdocument";
import { DocumentRegions } from "../embeddedSupport";
import { LanguageModelCache } from "../languageModelCache";
import { Diagnostic, LanguageMode, LanguageService, Position, Range } from "../languageModes";

const torpor = require("../../../../packages/view/dist/compile");
const tsvfs = require("@typescript/vfs");
//const torpor = require("@torpor/view/compile");

// TODO: use the user's tsconfig
const compilerOpts: ts.CompilerOptions = {
	target: ts.ScriptTarget.ESNext,
	esModuleInterop: true,
};
const virtualFiles = new Map<string, string>();

let loaded = false;
let projectRoot = "";
let env: any; //tsvfs.VirtualTypeScriptEnvironment;

export function getScriptMode(_regions: LanguageModelCache<DocumentRegions>): LanguageMode {
	return {
		getId() {
			return "script";
		},
		//doComplete(document: TextDocument, position: Position) {
		//	/* TODO: JS completion?? */
		//},
		doValidation(document: TextDocument) {
			// I can't get this to handle importing virtual files, maybe that's not supported?
			// Leaving this simple example here in case there's something obvious I'm doing wrong
			/*
			const projectRoot = path.join(__dirname, "..");
			const key = "index.ts";
			fsMap.set("index.ts", `import sum from "./sum.ts";\nconsole.log(sum(1, 2));`);
			fsMap.set("sum.ts", "export default function sum(a: number, b: number) {\nreturn a + b;\n}");
			//fsMap.set(
			//	"sum.d.ts",
			//	"declare function sum(a: number, b: number): number;\nexport default sum;",
			//);
			*/

			const filename = url.fileURLToPath(document.uri);
			const text = document.getText();
			let key = "";
			let map: any;
			if (!loaded) {
				// If using imports where the types don't directly match up to
				// their FS representation (like the imports for node) then use
				// triple-slash directives to make sure globals are set up
				// first.
				//const content = `/// <reference types="node" />\nimport * as path from 'path';\npath.`;

				// By providing a project root, the system knows how to resolve
				// node_modules correctly
				projectRoot = path.join(filename, ".");
				while (projectRoot && !fs.existsSync(path.join(projectRoot, "node_modules"))) {
					projectRoot = path.join(projectRoot, "..");
				}

				if (!projectRoot) {
					console.log("No project root found");
					return;
				}

				// I thought maybe we could import all files??
				/*
				let files: string[] = [];
				walk(path.join(projectRoot, "src"), files);

				for (let inFile of files) {
					const content = transform(inFile);
					// TODO: if not ok, don't validate!
					const outFile = path.relative(projectRoot, inFile.replace(/\.torp$/, ".ts"));
					fsMap.set(outFile, content[0]);

					const dtsFile = path.relative(projectRoot, inFile.replace(/\.torp$/, ".d.ts"));
					fsMap.set(dtsFile, content[1]);
					console.log(dtsFile, content[1]);
				}
				*/

				const transformed = transform(text, projectRoot);

				// If there were parse or build errors, return them immediately
				if (!transformed.ok) {
					return transformed.errors.map((e: any) => {
						return {
							message: e.message,
							range: {
								start: { line: e.startLine, character: e.startChar },
								end: { line: e.endLine, character: e.endChar },
							},
						} satisfies Diagnostic;
					});
				}

				const content = transformed.content;
				map = transformed.map;

				key = path.relative(projectRoot, filename.replace(/\.torp$/, ".ts"));
				virtualFiles.set(key, content);

				const system = tsvfs.createFSBackedSystem(virtualFiles, projectRoot, ts);
				env = tsvfs.createVirtualTypeScriptEnvironment(system, key, ts, compilerOpts);

				loaded = true;
				console.log("Torpor type checking loaded");
			} else {
				const transformed = transform(text, projectRoot);

				// If there were parse or build errors, return them immediately
				if (!transformed.ok) {
					return transformed.errors.map((e: any) => {
						return {
							message: e.message,
							range: {
								start: { line: e.startLine, character: e.startChar },
								end: { line: e.endLine, character: e.endChar },
							},
						} satisfies Diagnostic;
					});
				}

				const content = transformed.content;
				map = transformed.map;

				key = path.relative(projectRoot, filename.replace(/\.torp$/, ".ts"));
				if (!virtualFiles.has(key)) {
					virtualFiles.set(key, content);
					env.createFile(key, content);
				} else {
					virtualFiles.set(key, content);
					env.updateFile(key, content);
				}
			}

			const diagnostics = [
				...env.languageService.getSemanticDiagnostics(key),
				...env.languageService.getSyntacticDiagnostics(key),
			]
				.map((d) => {
					// Find the mapping between source and compiled, if it
					// exists. If it doesn't exist, the error must be in
					// non-user code. Not great, but the user doesn't need to
					// know about it
					let start = d.start ?? 0;
					let end = (d.start ?? 0) + (d.length ?? 0);
					let mapped = map.find((m: any) => start >= m.compiled.start && end <= m.compiled.end);

					// HACK: Couldn't map back to the source, so return a
					// special message that will be removed with `filter`
					if (!mapped) {
						// Log it for diagnostics
						console.log(d.messageText);
						return {
							message: "!",
							range: {
								start: { line: 0, character: 0 },
								end: { line: 0, character: 0 },
							},
						} satisfies Diagnostic;
					}

					// We have the mapping, so we know roughly where in the
					// source the error occurs, but now we need to narrow it
					// down to the exact location
					let sourceStart = mapped.source.start + start - mapped.compiled.start;
					let sourceEnd = mapped.source.start + end - mapped.compiled.start;

					// TODO: Store this, so we don't need to start from 0 every time
					let lastLineStart = 0;
					let startLine = 0;
					for (let i = 0; i < sourceStart; i++) {
						if (text[i] === "\n") {
							lastLineStart = i;
							startLine++;
						}
					}
					let startChar = sourceStart - lastLineStart - 1;
					let endLine = startLine;
					for (let i = sourceStart; i < sourceEnd; i++) {
						if (text[i] === "\n") {
							lastLineStart = i;
							endLine++;
						}
					}
					let endChar = sourceEnd - lastLineStart - 1;

					return {
						message: String(d.messageText),
						range: {
							start: {
								line: startLine,
								character: startChar,
							},
							end: {
								line: endLine,
								character: endChar,
							},
						},
					} satisfies Diagnostic;
				})
				.filter((d) => d.message !== "!");

			return diagnostics;
		},
		onDocumentRemoved(_document: TextDocument) {
			/* nothing to do */
		},
		dispose() {
			/* nothing to do */
		},
	};
}
/*
function walk(folder: string, out: string[]) {
	for (let file of fs.readdirSync(folder, { withFileTypes: true })) {
		const filename = path.join(folder, file.name);
		if (file.isDirectory()) {
			if (!file.name.startsWith("node_modules")) {
				walk(filename, out);
			}
		} else {
			let extname = path.extname(file.name);
			// TODO: probably other extensions
			if (extname !== ".torp") {
				continue;
			}
			out.push(filename);
		}
	}
}
*/
function transform(source: string, projectRoot: string) {
	// Build the main file as a component
	const parsed = torpor.parse(source);

	// If not ok, don't validate
	if (!parsed.ok) {
		return {
			ok: false,
			errors: parsed.errors,
			content: "",
			map: [],
		};
	}

	let built = torpor.build(parsed.template, { mapped: true });
	let content: string = built.code;
	let map = built.map;

	// Build imported component files as types
	// TODO: Cache the imported files
	// TODO: Handle files from node_modules
	// TODO: Get the code from fsMap if set, in case it has been edited and not saved
	const imports = content.matchAll(/^import\s+(.+?)\s+from\s+(.+?);*$/gm);
	for (let match of imports) {
		const value = match[0];
		//const name = match[1];
		let file = match[2];

		if (!file.includes(".torp")) continue;

		if (
			(file.startsWith("'") && file.endsWith("'")) ||
			(file.startsWith('"') && file.endsWith('"'))
		) {
			file = file.substring(1, file.length - 1);
		}

		content = content.replace(value, " ".repeat(value.length));

		// TODO: Get this from tsconfig, if set by the user
		file = file.replace("@/", "src/");

		const typeFile = path.join(projectRoot, file);
		const typeSource = fs.readFileSync(typeFile, "utf8");
		const typeParsed = torpor.parse(typeSource);
		if (typeParsed.template) {
			const typeContent = torpor
				.buildType(typeParsed.template!)
				// TODO: Handle imports with more finesse
				.replaceAll('import { type SlotRender } from "@torpor/view";', "")
				.replaceAll(/export default (.+?);/g, "");
			content += "\n" + typeContent;
		}
	}

	return {
		ok: true,
		errors: [],
		content,
		map,
	};
}
