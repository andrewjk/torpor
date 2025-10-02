import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import ts, { DiagnosticMessageChain } from "typescript";
import { TextDocument } from "vscode-languageserver-textdocument";
import { DocumentRegions } from "../embeddedSupport";
import { LanguageModelCache } from "../languageModelCache";
import { CompletionItem, Diagnostic, LanguageMode, Position } from "../languageModes";

//const torpor = require("@torpor/view/compile");
const torpor = require("../../../../packages/view/dist/compile");
const tsvfs = require("@typescript/vfs");

// TODO: use the user's tsconfig
const compilerOpts: ts.CompilerOptions = {
	target: ts.ScriptTarget.ES2022,
	module: ts.ModuleKind.ESNext,
	moduleResolution: ts.ModuleResolutionKind.Bundler,
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
		doComplete(document: TextDocument, position: Position) {
			const filename = url.fileURLToPath(document.uri);
			const key = filename.replace(/\.torp$/, ".ts");
			const text = document.getText();
			loadTypeScriptEnv(filename, key);
			const transformed = transform(text);
			const { content, map } = transformed;
			updateVirtualFile(key, content);

			// HACK: maybe we need to generate lineMaps
			let index = 0;
			let line = 0;
			for (; index < text.length; index++) {
				if (text[index] === "\n") {
					line++;
					if (line === position.line) {
						index += position.character + 1;
						break;
					}
				}
			}

			let mapped = map.find((m: any) => index >= m.source.start && index <= m.source.end);
			if (!mapped) {
				return [];
			}
			let compiledIndex = mapped.compiled.start + (index - mapped.source.start);

			const completions = env.languageService.getCompletionsAtPosition(key, compiledIndex, {});

			//console.log(JSON.stringify(completions, null, 2));
			return completions.entries.map((e: any) => {
				return {
					label: e.name,
					kind: 10,
					sortText: e.sortText,
					// TODO: need to get these somehow
					detail: e.detail,
					documentation: e.documentation,
				} satisfies CompletionItem;
			});
		},
		doValidation(document: TextDocument) {
			const filename = url.fileURLToPath(document.uri);
			const key = filename.replace(/\.torp$/, ".ts");
			const text = document.getText();
			loadTypeScriptEnv(filename, key);
			const transformed = transform(text);

			// If there were parse or build errors, return them immediately
			// TODO: Do we want to clear the virtual file??
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

			const { content, map } = transformed;
			updateVirtualFile(key, content);

			//console.log(content);
			const diagnostics = [
				...env.languageService.getSemanticDiagnostics(key),
				...env.languageService.getSyntacticDiagnostics(key),
			]
				.map((d: ts.Diagnostic) => {
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
						console.log("Error in generated code: ", d.messageText);
						// @ts-ignore
						const lineMap: number[] = d.file?.lineMap;
						if (lineMap) {
							const line = (lineMap.findIndex((l: number) => l > start) ?? 1) - 1;
							const char = start - lineMap[line];
							console.log(`(${line + 1}, ${char + 1}):`, content.split("\n")[line]);
						}

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

					let message = String(d.messageText);
					if (typeof d.messageText !== "string") {
						// HACK: I think this should get the messages in the
						// right order? But who knows...
						function getMessages(chain: DiagnosticMessageChain, messages: string[]) {
							messages.push(chain.messageText);
							if (chain.next !== undefined) {
								for (let next of chain.next) {
									getMessages(next, messages);
								}
							}
						}
						let messages: string[] = [];
						getMessages(d.messageText, messages);
						message = messages.join("\n");
					}
					return {
						message,
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

			//console.log(JSON.stringify(diagnostics, null, 2));
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

function loadTypeScriptEnv(filename: string, key: string) {
	if (!loaded) {
		// If using imports where the types don't directly match up to
		// their FS representation (like the imports for node) then use
		// triple-slash directives to make sure globals are set up
		// first.
		//const content = `
		//	/// <reference types="node" />
		//	import * as path from 'path';
		//	path.`.replaceAll(/\s+/, " ").trim();

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

		// NOTE: We can do this, and it works, but it seems like it
		// might use a lot of memory and be quite slow? Instead, we're
		// just inserting type definitions from components in the bottom
		// of the source code where they won't interfere with anything

		// Import all `.torp` files
		// TODO: Work on making compilation faster!
		//let torporFiles: string[] = [];
		//walk(path.join(projectRoot, "src"), torporFiles);
		//for (let projectFile of torporFiles) {
		//	console.log(projectFile);
		//	const source = fs.readFileSync(projectFile, "utf8");
		//	const { content } = transform(source, projectRoot);
		//	const projectFileKey = projectFile.replace(/\.torp$/, ".ts");
		//	virtualFiles.set(projectFileKey, content);
		//}

		// Push a dummy file into the map, it will get updated shortly
		virtualFiles.set(key, "const x = 5;");

		const system = tsvfs.createFSBackedSystem(virtualFiles, projectRoot, ts);
		env = tsvfs.createVirtualTypeScriptEnvironment(system, key, ts, compilerOpts);

		loaded = true;
		console.log("Torpor type checking loaded");
	}
}

function updateVirtualFile(key: string, content: string) {
	if (!virtualFiles.has(key)) {
		virtualFiles.set(key, content);
		env.createFile(key, content);
	} else {
		virtualFiles.set(key, content);
		env.updateFile(key, content);
	}
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
			if (extname !== ".torp") {
				continue;
			}
			out.push(filename);
		}
	}
}
*/

interface TransformResult {
	ok: boolean;
	errors: any[];
	content: string;
	map: any;
}

function transform(source: string): TransformResult {
	try {
		// replaceImportFileNames(source, projectRoot);

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

		let { code, map } = torpor.build(parsed.template, { mapped: true });

		code = importFileTypes(code);

		return {
			ok: true,
			errors: [],
			content: code,
			map,
		};
	} catch (ex) {
		console.log("Failed to compile", source);
		console.log(ex);
		return {
			ok: false,
			errors: [],
			content: "",
			map: [],
		};
	}
}
/*
function replaceImportFileNames(source: string): string {
	// Replace `.torp` imports with `.ts` and any imports in `@/` with `src/`
	const imports = source.matchAll(/^import\s+(.+?)\s+from\s+(.+?);*$/gm);
	for (let match of imports) {
		const value = match[0];
		const name = match[1];
		let file = match[2];

		if (
			(file.startsWith("'") && file.endsWith("'")) ||
			(file.startsWith('"') && file.endsWith('"'))
		) {
			file = file.substring(1, file.length - 1);
		}

		if (!file.endsWith(".torp")) continue;

		// TODO: Get this from tsconfig, if set by the user
		if (file.startsWith("@/")) file = file.replace("@/", "src/");
		if (!file.startsWith("/")) file = path.resolve(projectRoot, file);

		source = source.replace(value, `import ${name} from "${file.replace(".torp", "")}";`);
	}
	return source;
}
*/
function importFileTypes(content: string): string {
	// Build imported component files as types
	// TODO: Cache the imported files
	// TODO: Handle files from node_modules? Might get done automatically by typescript-vfs
	// TODO: Get the code from virtualFiles if set, in case it has been edited and not saved
	const imports = content.matchAll(/^import\s+(.+?)\s+from\s+(.+?);*$/gm);
	for (let match of imports) {
		const value = match[0];
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
	return content;
}
