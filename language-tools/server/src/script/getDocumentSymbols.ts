import { type NavigationTree } from "typescript";
import { type CancellationToken, type DocumentSymbol, SymbolKind } from "vscode-languageserver";
import { type TextDocument } from "vscode-languageserver-textdocument";
import type SourceMap from "./SourceMap";
import { loadDocument } from "./loadDocument";
import rangeFromSpan from "./rangeFromSpan";
import sourceIndexFromCompiledIndex from "./sourceIndexFromCompiledIndex";

export default function getDocumentSymbols(
	document: TextDocument,
	_cancellationToken?: CancellationToken,
): DocumentSymbol[] | null {
	try {
		const transformed = loadDocument(document);
		if (!transformed.ok) {
			return null;
		}
		const { key, text, map, vts } = transformed;

		const tree: NavigationTree = vts.lang.getNavigationTree(key);

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
	const sourceIndex = span ? sourceIndexFromCompiledIndex(span.start, map) : -1;
	if (sourceIndex !== -1) {
		const range = rangeFromSpan(text, sourceIndex, sourceIndex + span.length);
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
