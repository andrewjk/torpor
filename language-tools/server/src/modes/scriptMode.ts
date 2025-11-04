import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import ts, { DiagnosticMessageChain, LanguageService, NavigationTree } from "typescript";
import {
	CancellationToken,
	CompletionContext,
	DocumentSymbol,
	Location,
	SelectionRange,
	SymbolKind,
} from "vscode-languageserver";
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
let tsConfigPath: string | undefined;

let projectRoot = "";
let virtualFiles = new Map<string, string>();
let virtualFileMaps = new Map<string, { sourceFile: string; map: SourceMap[] }>();
let env: any; //tsvfs.VirtualTypeScriptEnvironment;
let tslang: LanguageService;

// Copied from @torpor/view because I can't get the types out of there...
interface SourceMap {
	script: string;
	source: { start: number; end: number };
	compiled: { start: number; end: number };
}

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

function doComplete(document: TextDocument, position: Position, context?: CompletionContext) {
	try {
		const filename = url.fileURLToPath(document.uri);
		const key = filename.replace(/\.torp$/, ".ts");
		const text = document.getText();
		loadTypeScriptEnv(filename, key);
		const transformed = transform(filename, text);
		if (!transformed.ok) {
			return null;
		}
		const { content, map } = transformed;
		updateVirtualFile(key, content, filename, map);

		let compiledIndex = sourceToCompiledIndex(text, position, map);
		if (compiledIndex === -1) {
			return [];
		}

		const completions = tslang.getCompletionsAtPosition(key, compiledIndex, {
			triggerKind: context?.triggerKind,
		});
		if (!completions) {
			return [];
		}

		const result = completions.entries
			.map((e: any) => {
				// HACK: probably a better way to do this -- the `$` isn't
				// included in the symbol for some reason
				if (context?.triggerCharacter === "$" && !e.name.startsWith("$")) {
					return null;
				}

				let completion: CompletionItem = {
					label: e.name,
					kind: e.kind,
					insertText: e.insertText,
					sortText: e.sortText,
					// I guess these ones?
					commitCharacters: [".", ",", ";", "("],
					// TODO: need to get these somehow
					detail: e.detail,
					documentation: e.documentation,
				};

				// HACK: see above
				if (e.name.startsWith("$")) {
					completion.textEdit = {
						range: {
							start: { line: position.line, character: position.character - 1 },
							// TODO: What should end be?
							end: { line: position.line, character: position.character - 1 },
						},
						newText: e.name,
					};
				}
				return completion;
			})
			.filter(Boolean);

		return result as any;
	} catch (ex) {
		console.log("COMPLETE ERROR:", ex);
		return null;
	}
}

function doHover(document: TextDocument, position: Position): Hover | null {
	try {
		const filename = url.fileURLToPath(document.uri);
		const key = filename.replace(/\.torp$/, ".ts");
		const text = document.getText();
		loadTypeScriptEnv(filename, key);
		const transformed = transform(filename, text);
		if (!transformed.ok) {
			return null;
		}
		const { content, map } = transformed;
		updateVirtualFile(key, content, filename, map);

		let compiledIndex = sourceToCompiledIndex(text, position, map);
		if (compiledIndex === -1) {
			return null;
		}

		const info = tslang.getQuickInfoAtPosition(key, compiledIndex);
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
	} catch (ex) {
		console.log("HOVER ERROR:", ex);
		return null;
	}
}

function doDefinition(document: TextDocument, position: Position): Definition | null {
	try {
		const filename = url.fileURLToPath(document.uri);
		const key = filename.replace(/\.torp$/, ".ts");
		const text = document.getText();
		loadTypeScriptEnv(filename, key);
		const transformed = transform(filename, text);
		if (!transformed.ok) {
			return null;
		}
		const { content, map } = transformed;
		updateVirtualFile(key, content, filename, map);

		let compiledIndex = sourceToCompiledIndex(text, position, map);
		if (compiledIndex === -1) {
			return null;
		}

		const defs = tslang.getDefinitionAtPosition(key, compiledIndex);
		if (!defs || !defs.length) {
			return null;
		}

		let { fileName, textSpan } = defs[0];
		let fileMap = virtualFileMaps.get(fileName);
		if (fileMap) {
			fileName = fileMap.sourceFile;
		}

		const fileContent = fs.readFileSync(filename, "utf8");

		const start = fileMap ? compiledToSourceIndex(textSpan.start, fileMap.map) : textSpan.start;
		const range = getRange(fileContent, start, start + textSpan.length);

		return {
			uri: fileName,
			range,
		};
	} catch (ex) {
		console.log("DEFINITION ERROR:", ex);
		return null;
	}
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

function sourceToCompiledIndex(text: string, position: Position, map: SourceMap[]): number {
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

function rangeToSpan(text: string, range: Range) {
	// HACK: maybe we need to generate lineMaps
	let start = 0;
	let end = 0;
	let line = 0;
	for (let i = 0; i < text.length; i++) {
		if (text[i] === "\n") {
			line++;
			if (line === range.start.line) {
				start = i + range.start.character;
			}
			if (line === range.end.line) {
				end = i + range.end.character;
				break;
			}
		}
	}
	return { start, length: end - start };
}

function doValidation(document: TextDocument) {
	const filename = url.fileURLToPath(document.uri);
	const key = filename.replace(/\.torp$/, ".ts");
	const text = document.getText();
	loadTypeScriptEnv(filename, key);
	const transformed = transform(filename, text, true);

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
	updateVirtualFile(key, content, filename, map);

	//console.log(content);
	//console.log(map);

	// HACK: Is this ok to do every check? We're doing it because otherwise
	// changes to linked files (e.g. adding or removing a field in an interface)
	// don't get picked up. But doing it here also means that it only happens
	// when the file is edited...
	tslang.cleanupSemanticCache();

	const diagnostics = [
		...tslang.getSemanticDiagnostics(key),
		...tslang.getSyntacticDiagnostics(key),
	]
		.map((d: ts.Diagnostic) => {
			// Find the mapping between source and compiled, if it exists. If it
			// doesn't exist, the error must be in non-user code. Not great, but
			// the user doesn't need to know about it
			let start = d.start ?? 0;
			let end = (d.start ?? 0) + (d.length ?? 0);
			let mapped = map.find((m: any) => start >= m.compiled.start && end <= m.compiled.end);

			let message = getMessageText(d);

			// HACK: We don't care about these? Maybe there's a better way to
			// ignore/fix them
			if (
				message.startsWith("This import uses a '.ts' extension to resolve") ||
				/Cannot find module '(.+?)\?raw'/.test(message)
			) {
				mapped = undefined;
				// This special message will be filtered out
				message = "!";
			}

			if (!mapped && message !== "!") {
				// Log it for diagnostics
				console.log(`Error${!mapped ? " (unmapped)" : ""}:`, message);
				// @ts-ignore we know this exists
				const lineMap: number[] = d.file?.lineMap;
				if (lineMap) {
					const line = (lineMap.findIndex((l: number) => l > start) ?? 1) - 1;
					const char = start - lineMap[line];
					console.log(`(${line + 1}, ${char + 1}):`, content.split("\n")[line]);
				}
			}

			// HACK: Couldn't map back to the source, so just display it at the
			// first character
			if (!mapped) {
				return {
					message,
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

			// HACK: If the translated mapping is outside of the source mapping,
			// just highlight the source mapping. It won't be 100% accurate, but
			// better than showing it way off in the middle of nowhere. This
			// happens e.g. when the $props are bad (as `<Component>` maps to
			// something like `Component($parent, $anchor, $props)`
			if (sourceStart > mapped.source.end) {
				sourceStart = mapped.source.start;
				sourceEnd = mapped.source.end;
			}
			// Same thing for if the error extends too far
			if (sourceEnd > mapped.source.end) {
				sourceEnd = mapped.source.end;
			}

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
				code: d.code,
				message,
			} satisfies Diagnostic;
		})
		.filter((d) => d.message !== "!");

	return diagnostics;
}

function getMessageText(d: ts.Diagnostic): string {
	if (typeof d.messageText === "string") {
		return d.messageText;
	} else {
		let messages: string[] = [];
		getMessages(d.messageText, messages);
		return messages.map((m, i) => " ".repeat(i * 2) + m).join("\n");
	}
}

function getMessages(chain: DiagnosticMessageChain, messages: string[]) {
	messages.push(chain.messageText);
	if (chain.next !== undefined) {
		for (let next of chain.next) {
			getMessages(next, messages);
		}
	}
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

		// Push a dummy file into the map, it will get updated shortly
		virtualFiles.set(key, "const x = 5;");

		const system = tsvfs.createFSBackedSystem(virtualFiles, projectRoot, ts);
		env = tsvfs.createVirtualTypeScriptEnvironment(system, [key], ts, tsConfig);
		tslang = env.languageService as LanguageService;

		console.log("Torpor type checking loaded");
	}
}

function updateVirtualFile(key: string, content: string, sourceFile: string, map: SourceMap[]) {
	if (!virtualFiles.has(key)) {
		env.createFile(key, content);
	} else {
		env.updateFile(key, content);
	}
	virtualFiles.set(key, content);
	virtualFileMaps.set(key, { sourceFile, map });
}

function loadTypeScriptConfig(): Record<string, any> | undefined {
	const configFileName = ts.findConfigFile(projectRoot, ts.sys.fileExists);
	if (configFileName) {
		tsConfigPath = path.dirname(configFileName);
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
	map: SourceMap[];
}

function transform(filename: string, source: string, debug = false): TransformResult {
	try {
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

		code = importComponentFiles(filename, code, map, debug);

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

function importComponentFiles(
	filename: string,
	content: string,
	map: SourceMap[],
	_debug = false,
): string {
	if (!/^\s*import\s+(.+?)\s+from\s+(.+?);*\s*$/ms.test(content)) {
		return content;
	}

	// Build imported component files and add them to the virtual file map
	// TODO: Handle files from node_modules? Might get done automatically by typescript-vfs

	// HACK: We're assuming that all imports are at the top of the file, and
	// that there are not multiple imports on the one line
	const first = map.shift()!;
	const filepath = path.dirname(filename);

	let moved = 0;
	let newMaps: SourceMap[] = [];

	for (let i = 0; i < first.script.length; i++) {
		if (first.script[i] === "/") {
			// Skip comments
			if (first.script[i + 1] === "/") {
				i = first.script.indexOf("\n", i);
			} else if (first.script[i + 1] === "*") {
				i = first.script.indexOf("*/", i);
			}
			if (i === -1) {
				return content;
			}
		} else if (
			first.script[i] === "i" &&
			/import\s+(.+?)\s+from\s+(.+?);*\s*$/ms.test(first.script.substring(i))
		) {
			const match = first.script.substring(i).match(/import\s+(.+?)\s+from\s+(.+?);*\s*$/ms)!;
			const oldImport = match[0];
			//const names = match[1];
			const importedFile = match[2];

			let importFile = importedFile;
			if (
				(importFile.startsWith("'") && importFile.endsWith("'")) ||
				(importFile.startsWith('"') && importFile.endsWith('"'))
			) {
				importFile = importFile.substring(1, importFile.length - 1);
			}

			if (!importFile.endsWith(".torp")) {
				// No change, just straight map it
				newMaps.push({
					script: oldImport,
					source: {
						start: i,
						end: i + oldImport.length,
					},
					compiled: {
						start: first.compiled.start + i + moved,
						end: first.compiled.start + i + moved + oldImport.length,
					},
				});
				continue;
			}

			if (tsConfigPath && tsConfig.paths) {
				// HACK: Get the longest match etc
				const oldImportFile = importFile;
				for (let [srcGlob, paths] of Object.entries(tsConfig.paths)) {
					for (let destGlob of paths) {
						importFile = pathReplace(srcGlob, destGlob, importFile);
					}
				}
				// The import may now be relative to the tsconfig file, so make it absolute
				if (importFile !== oldImportFile && importFile.startsWith(".")) {
					importFile = path.join(tsConfigPath, importFile);
				}
			}

			const typeFile = importFile.startsWith(".") ? path.join(filepath, importFile) : importFile;
			if (!virtualFiles.has(typeFile) && fs.existsSync(typeFile)) {
				const typeSource = fs.readFileSync(typeFile, "utf8");
				const { content } = transform(typeFile, typeSource);
				const key = typeFile.replace(/\.torp$/, ".ts");
				virtualFiles.set(key, content);
				env.createFile(key, content);
			}

			let oldLength = content.length;
			let newValue = typeFile.replace(".torp", ".ts");
			// HACK: We could concat this if we could be bothered
			let newImport = oldImport.replace(importFile, newValue);
			content = content.replace(oldImport, newImport);

			// Move subsequent ranges around
			let diff = content.length - oldLength;
			for (let mapped of map) {
				mapped.compiled.start += diff;
				mapped.compiled.end += diff;
			}

			// Add a range for the changed import
			newMaps.push({
				script: oldImport,
				source: {
					start: i,
					end: i + oldImport.length,
				},
				compiled: {
					start: first.compiled.start + i + moved,
					end: first.compiled.start + i + moved + newImport.length,
				},
			});

			moved += diff;
			i += oldImport.length;
		}
	}

	map.unshift(...newMaps);

	return content;
}

export function getSelectionRanges(
	document: TextDocument,
	_positions: Position[],
	_cancellationToken?: CancellationToken,
): SelectionRange[] | null {
	try {
		const filename = url.fileURLToPath(document.uri);
		const key = filename.replace(/\.torp$/, ".ts");
		const text = document.getText();
		loadTypeScriptEnv(filename, key);
		const transformed = transform(filename, text);
		if (!transformed.ok) {
			return null;
		}
		const { content, map } = transformed;
		updateVirtualFile(key, content, filename, map);

		let ranges: SelectionRange[] = [];

		//for (let position of positions) {
		//	const selection: SelectionRange = tslang.getSmartSelectionRange(key, position);
		//}

		return ranges;
	} catch (ex) {
		console.log("SELECTION RANGE ERROR:", ex);
		return null;
	}
}

export function getSemanticTokens(
	document: TextDocument,
	range?: Range,
	_cancellationToken?: CancellationToken,
) {
	try {
		const filename = url.fileURLToPath(document.uri);
		const key = filename.replace(/\.torp$/, ".ts");
		const text = document.getText();
		loadTypeScriptEnv(filename, key);
		const transformed = transform(filename, text);
		if (!transformed.ok) {
			return null;
		}
		const { content, map } = transformed;
		updateVirtualFile(key, content, filename, map);

		const span = range ? rangeToSpan(text, range) : { start: 0, length: content.length };

		const { spans } = tslang.getEncodedSemanticClassifications(
			key,
			span,
			ts.SemanticClassificationFormat.TwentyTwenty,
		);

		let sourceSpans = [] as number[];
		for (let i = 0; i < spans.length; ) {
			const start = spans[i++];
			const length = spans[i++];
			const tokenType = spans[i++];
			const sourceIndex = compiledToSourceIndex(start, map);
			if (sourceIndex !== -1) {
				sourceSpans.push(sourceIndex, length, tokenType);
			}
		}

		return sourceSpans;
	} catch (ex) {
		console.log("SEMANTIC TOKENS ERROR:", ex);
		return null;
	}
}

export function getDocumentSymbols(
	document: TextDocument,
	_cancellationToken?: CancellationToken,
): DocumentSymbol[] | null {
	try {
		const filename = url.fileURLToPath(document.uri);
		const key = filename.replace(/\.torp$/, ".ts");
		const text = document.getText();
		loadTypeScriptEnv(filename, key);
		const transformed = transform(filename, text);
		if (!transformed.ok) {
			return null;
		}
		const { content, map } = transformed;
		updateVirtualFile(key, content, filename, map);

		const tree: NavigationTree = tslang.getNavigationTree(key);

		let symbols: DocumentSymbol[] = [];

		collectSymbols(tree, symbols, text, map);

		return symbols;
	} catch (ex) {
		console.log("DOCUMENT SYMBOLS ERROR:", ex);
		return null;
	}
}

function collectSymbols(
	tree: NavigationTree,
	symbols: DocumentSymbol[],
	text: string,
	map: SourceMap[],
) {
	//const range = rangeFromTextSpan(tree.nameSpan);
	const span = tree.nameSpan ?? tree.spans[0];
	const sourceIndex = span ? compiledToSourceIndex(span.start, map) : -1;
	if (sourceIndex !== -1) {
		const range = getRange(text, sourceIndex, sourceIndex + span.length);
		const symbol = {
			name: tree.text,
			kind: symbolKindFromString(tree.kind),
			range,
			selectionRange: range,
		};
		symbols.push(symbol);
	}
	if (tree.childItems) {
		for (let child of tree.childItems) {
			collectSymbols(child, symbols, text, map);
		}
	}
}

function symbolKindFromString(kind: string): SymbolKind {
	switch (kind) {
		case "module":
			return SymbolKind.Module;
		case "class":
			return SymbolKind.Class;
		case "local class":
			return SymbolKind.Class;
		case "interface":
			return SymbolKind.Interface;
		case "enum":
			return SymbolKind.Enum;
		case "enum member":
			return SymbolKind.Constant;
		case "var":
			return SymbolKind.Variable;
		case "local var":
			return SymbolKind.Variable;
		case "function":
			return SymbolKind.Function;
		case "local function":
			return SymbolKind.Function;
		case "method":
			return SymbolKind.Method;
		case "getter":
			return SymbolKind.Method;
		case "setter":
			return SymbolKind.Method;
		case "property":
			return SymbolKind.Property;
		case "constructor":
			return SymbolKind.Constructor;
		case "parameter":
			return SymbolKind.Variable;
		case "type parameter":
			return SymbolKind.Variable;
		case "alias":
			return SymbolKind.Variable;
		case "let":
			return SymbolKind.Variable;
		case "const":
			return SymbolKind.Constant;
		case "JSX attribute":
			return SymbolKind.Property;
		default:
			return SymbolKind.Variable;
	}
}

export function getImplementation(
	document: TextDocument,
	position: Position,
	_cancellationToken?: CancellationToken,
): Location | null {
	try {
		const filename = url.fileURLToPath(document.uri);
		const key = filename.replace(/\.torp$/, ".ts");
		const text = document.getText();
		loadTypeScriptEnv(filename, key);
		const transformed = transform(filename, text);
		if (!transformed.ok) {
			return null;
		}
		const { content, map } = transformed;
		updateVirtualFile(key, content, filename, map);

		const compiledIndex = sourceToCompiledIndex(text, position, map);
		if (compiledIndex === -1) {
			return null;
		}

		const imps = tslang.getImplementationAtPosition(key, compiledIndex);
		if (!imps || !imps.length) {
			return null;
		}

		let { fileName, textSpan } = imps[0];
		let fileMap = virtualFileMaps.get(fileName);
		if (fileMap) {
			fileName = fileMap.sourceFile;
		}

		const fileContent = fs.readFileSync(filename, "utf8");

		const start = fileMap ? compiledToSourceIndex(textSpan.start, fileMap.map) : textSpan.start;
		const range = getRange(fileContent, start, start + textSpan.length);

		return {
			uri: fileName,
			range,
		};
	} catch (ex) {
		console.log("IMPLEMENTATION ERROR:", ex);
		return null;
	}
}

function compiledToSourceIndex(index: number, map: SourceMap[]): number {
	const mapped = map.find((m: any) => index >= m.compiled.start && index <= m.compiled.end);
	if (!mapped) {
		return -1;
	}
	return mapped.source.start + (index - mapped.compiled.start);
}
