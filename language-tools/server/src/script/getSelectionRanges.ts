import { type CancellationToken, type Position, type SelectionRange } from "vscode-languageserver";
import { type TextDocument } from "vscode-languageserver-textdocument";
import { loadDocument } from "./loadDocument";

export default function getSelectionRanges(
	document: TextDocument,
	_positions: Position[],
	_cancellationToken?: CancellationToken,
): SelectionRange[] | null {
	try {
		const transformed = loadDocument(document);
		if (!transformed.ok) {
			return null;
		}
		//const { key, text, map, vts } = transformed;
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
