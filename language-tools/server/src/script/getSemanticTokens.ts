import ts from "typescript";
import { type CancellationToken, type Range } from "vscode-languageserver";
import { type TextDocument } from "vscode-languageserver-textdocument";
import { loadDocument } from "./loadDocument";
import sourceIndexFromCompiledIndex from "./sourceIndexFromCompiledIndex";
import sourceSpanFromSourceRange from "./sourceSpanFromSourceRange";

export default function getSemanticTokens(
	document: TextDocument,
	range?: Range,
	_cancellationToken?: CancellationToken,
) {
	try {
		const transformed = loadDocument(document);
		if (!transformed.ok) {
			return null;
		}
		const { key, text, content, map, vts } = transformed;

		const span = range
			? sourceSpanFromSourceRange(text, range)
			: { start: 0, length: content.length };

		const { spans } = vts.lang.getEncodedSemanticClassifications(
			key,
			span,
			ts.SemanticClassificationFormat.TwentyTwenty,
		);

		let sourceSpans = [] as number[];
		for (let i = 0; i < spans.length; ) {
			const start = spans[i++];
			const length = spans[i++];
			const tokenType = spans[i++];
			const sourceIndex = sourceIndexFromCompiledIndex(start, map);
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
