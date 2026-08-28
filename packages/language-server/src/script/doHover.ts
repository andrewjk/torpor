import ts from "typescript";
import { type Hover, type Position } from "vscode-languageserver";
import { type TextDocument } from "vscode-languageserver-textdocument";
import { getMarkdownDocumentation } from "../utils/previewer";
import compiledIndexFromSourcePosition from "./compiledIndexFromSourcePosition";
import { loadDocument } from "./loadDocument";

export default function doHover(document: TextDocument, position: Position): Hover | null {
	try {
		const transformed = loadDocument(document);
		if (!transformed.ok) {
			return null;
		}
		const { key, text, map, vts } = transformed;

		let compiledIndex = compiledIndexFromSourcePosition(text, position, map);
		if (compiledIndex === -1) {
			return null;
		}

		const info = vts.lang.getQuickInfoAtPosition(key, compiledIndex);
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
