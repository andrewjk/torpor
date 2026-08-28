import fs from "node:fs";
import { type Definition, type Position } from "vscode-languageserver";
import { type TextDocument } from "vscode-languageserver-textdocument";
import compiledIndexFromSourcePosition from "./compiledIndexFromSourcePosition";
import { loadDocument } from "./loadDocument";
import rangeFromSpan from "./rangeFromSpan";
import sourceIndexFromCompiledIndex from "./sourceIndexFromCompiledIndex";

export default function doDefinition(
	document: TextDocument,
	position: Position,
): Definition | null {
	try {
		const transformed = loadDocument(document);
		if (!transformed.ok) {
			return null;
		}
		const { filename, key, text, map, vts } = transformed;

		let compiledIndex = compiledIndexFromSourcePosition(text, position, map);
		if (compiledIndex === -1) {
			return null;
		}

		const defs = vts.lang.getDefinitionAtPosition(key, compiledIndex);
		if (!defs || !defs.length) {
			return null;
		}

		let { fileName, textSpan } = defs[0];
		let fileMap = vts.virtualFileMaps.get(fileName);
		if (fileMap) {
			fileName = fileMap.sourceFile;
		}

		const fileContent = fs.readFileSync(filename, "utf8");

		const start = fileMap
			? sourceIndexFromCompiledIndex(textSpan.start, fileMap.map)
			: textSpan.start;
		const range = rangeFromSpan(fileContent, start, start + textSpan.length);

		return {
			uri: fileName,
			range,
		};
	} catch (ex) {
		console.log("DEFINITION ERROR:", ex);
		return null;
	}
}
