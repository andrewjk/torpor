import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import ts, { DiagnosticMessageChain } from "typescript";
import { TextDocument } from "vscode-languageserver-textdocument";
import { DocumentRegions } from "../embeddedSupport";
import { LanguageModelCache } from "../languageModelCache";
import {
	CompletionItem,
	Definition,
	Diagnostic,
	Hover,
	LanguageMode,
	Position,
	Range,
} from "../languageModes";
import pathReplace from "../utils/pathReplace";
import { getMarkdownDocumentation } from "../utils/previewer";

const torpor = require("@torpor/view/compile");
//const torpor = require("../../../../packages/view/dist/compile");
const tsvfs = require("@typescript/vfs");

// This is just the default config, it should be overwritten by the one from the
// user's tsconfig.json
let tsConfig: ts.CompilerOptions = {
	target: ts.ScriptTarget.ES2022,
	module: ts.ModuleKind.ESNext,
	moduleResolution: ts.ModuleResolutionKind.Bundler,
	esModuleInterop: true,
};

let projectRoot = "";
let virtualFiles = new Map<string, string>();
let env: any; //tsvfs.VirtualTypeScriptEnvironment;

export function getScriptMode(_regions: LanguageModelCache<DocumentRegions>): LanguageMode {
	return {
		getId() {
			return "script";
		},
		doComplete,
		doValidation,
		doHover,
		doDefinition,
		onDocumentRemoved(_document: TextDocument) {
			/* nothing to do */
		},
		dispose() {
			/* nothing to do */
		},
	};
}

function doComplete(document: TextDocument, position: Position) {
	const filename = url.fileURLToPath(document.uri);
	const key = filename.replace(/\.torp$/, ".ts");
	const text = document.getText();
	loadTypeScriptEnv(filename, key);
	const transformed = transform(filename, text);
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

	let compiledIndex = translatePosition(text, position, map);
	if (compiledIndex === -1) {
		return [];
	}

	const completions = env.languageService.getCompletionsAtPosition(key, compiledIndex, {});
	if (!completions) {
		return [];
	}

	//console.log(JSON.stringify(completions, null, 2));
	return completions.entries.map((e: any) => {
		return {
			label: e.name,
			kind: e.kind,
			sortText: e.sortText,
			// I guess these ones?
			commitCharacters: [".", ",", ";", "("],
			// TODO: need to get these somehow
			detail: e.detail,
			documentation: e.documentation,
		} satisfies CompletionItem;
	});
}

function doHover(document: TextDocument, position: Position): Hover | null {
	const filename = url.fileURLToPath(document.uri);
	const key = filename.replace(/\.torp$/, ".ts");
	const text = document.getText();
	loadTypeScriptEnv(filename, key);
	const transformed = transform(filename, text);
	const { content, map } = transformed;
	updateVirtualFile(key, content);

	let compiledIndex = translatePosition(text, position, map);
	if (compiledIndex === -1) {
		return null;
	}

	const info = env.languageService.getQuickInfoAtPosition(key, compiledIndex);
	if (!info) {
		return null;
	}

	// Stole this from the Svelte extension:
	let declaration = ts.displayPartsToString(info.displayParts);
	const documentation = getMarkdownDocumentation(info.documentation, info.tags);
	// https://microsoft.github.io/language-server-protocol/specification#textDocument_hover
	const contents = ["```typescript", declaration, "```"]
		.concat(documentation ? ["---", documentation] : [])
		.join("\n");

	return {
		contents,
	};
}

function doDefinition(document: TextDocument, position: Position): Definition | null {
	const filename = url.fileURLToPath(document.uri);
	const key = filename.replace(/\.torp$/, ".ts");
	const text = document.getText();
	loadTypeScriptEnv(filename, key);
	const transformed = transform(filename, text);
	const { content, map } = transformed;
	updateVirtualFile(key, content);

	let compiledIndex = translatePosition(text, position, map);
	if (compiledIndex === -1) {
		return null;
	}

	const defs = env.languageService.getDefinitionAtPosition(key, compiledIndex);
	if (!defs || !defs.length) {
		return null;
	}

	let definitionFile = defs[0].fileName;
	const definitionSource = fs.readFileSync(definitionFile, "utf8");

	return {
		uri: definitionFile,
		range: getRange(
			definitionSource,
			defs[0].textSpan.start,
			defs[0].textSpan.start + defs[0].textSpan.length,
		),
	};
}

function getRange(text: string, start: number, end: number): Range {
	let line = 0;
	let lastLineStart = 0;
	let range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
	for (let i = 0; i < text.length; i++) {
		if (text[i] === "\n") {
			line++;
			lastLineStart = i;
		}
		if (i === start) {
			range.start.line = line;
			range.start.character = start - lastLineStart - 1;
		} else if (i === end) {
			range.end.line = line;
			range.end.character = end - lastLineStart - 1;
			break;
		}
	}
	return range;
}

function translatePosition(text: string, position: Position, map: any): number {
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
	const mapped = map.find((m: any) => index >= m.source.start && index <= m.source.end);
	if (!mapped) {
		return -1;
	}
	return mapped.compiled.start + (index - mapped.source.start);
}

function doValidation(document: TextDocument) {
	const filename = url.fileURLToPath(document.uri);
	const key = filename.replace(/\.torp$/, ".ts");
	const text = document.getText();
	loadTypeScriptEnv(filename, key);
	const transformed = transform(filename, text);

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
}

function loadTypeScriptEnv(filename: string, key: string) {
	if (env === undefined) {
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

		// Maybe load tsconfig from a file
		// TODO: reload if the file is changed
		try {
			let fileConfig = loadTypeScriptConfig();
			if (fileConfig?.options) {
				tsConfig = fileConfig.options;
			}
		} catch {
			console.log("No tsconfig.json file found, using default");
		}

		// NOTE: We can do this, and it works, but it seems like it
		// might use a lot of memory and be quite slow? Instead, we're
		// just inserting type definitions from components in the bottom
		// of the source code where they won't interfere with anything

		// Import all `.torp` files
		// TODO: Work on making compilation faster!
		// TODO: Use tsconfig include paths instead of "src"
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
		env = tsvfs.createVirtualTypeScriptEnvironment(system, key, ts, tsConfig);

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

function loadTypeScriptConfig(): Record<string, any> | undefined {
	const configFileName = ts.findConfigFile(projectRoot, ts.sys.fileExists);
	if (configFileName) {
		const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
		return ts.parseJsonConfigFileContent(configFile.config, ts.sys, projectRoot);
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

function transform(filename: string, source: string): TransformResult {
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

		code = importFileTypes(filename, code);

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
function importFileTypes(filename: string, content: string): string {
	const filepath = path.dirname(filename);
	// Build imported component files as types
	// TODO: Cache the imported files
	// TODO: Handle files from node_modules? Might get done automatically by typescript-vfs
	// TODO: Get the code from virtualFiles if set, in case it has been edited and not saved
	const imports = content.matchAll(/^import\s+(.+?)\s+from\s+(.+?);*$/gm);
	for (let match of imports) {
		const value = match[0];
		let importFile = match[2];

		if (!importFile.includes(".torp")) continue;

		if (
			(importFile.startsWith("'") && importFile.endsWith("'")) ||
			(importFile.startsWith('"') && importFile.endsWith('"'))
		) {
			importFile = importFile.substring(1, importFile.length - 1);
		}

		content = content.replace(value, " ".repeat(value.length));

		if (tsConfig.paths) {
			for (let [srcGlob, paths] of Object.entries(tsConfig.paths)) {
				for (let destGlob of paths) {
					importFile = pathReplace(srcGlob, destGlob, importFile);
				}
			}
		}

		const typeFile = path.join(filepath, importFile);
		if (fs.existsSync(typeFile)) {
			const typeSource = fs.readFileSync(typeFile, "utf8");
			const typeParsed = torpor.parse(typeSource);
			if (typeParsed.ok && typeParsed.template) {
				const typeContent = torpor
					.buildType(typeParsed.template!)
					// TODO: Handle imports with more finesse
					.replaceAll('import { type SlotRender } from "@torpor/view";', "")
					.replaceAll(/export default (.+?);/g, "");
				content += "\n" + typeContent;
			}
		}
	}
	return content;
}
