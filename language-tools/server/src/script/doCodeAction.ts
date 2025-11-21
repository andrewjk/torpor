import { type CodeAction, type CodeActionContext, type Range } from "vscode-languageserver";
import { type TextDocument } from "vscode-languageserver-textdocument";
import { loadDocument } from "./loadDocument";
import sourceSpanFromSourceRange from "./sourceSpanFromSourceRange";

export default function doCodeAction(
	document: TextDocument,
	range: Range,
	context: CodeActionContext,
): CodeAction[] {
	try {
		const transformed = loadDocument(document);
		if (!transformed.ok) {
			return [];
		}
		const { key, text, vts } = transformed;

		const span = sourceSpanFromSourceRange(text, range);
		const errorCodes = context.diagnostics.map((d) => Number(d.code));

		const fixes = vts.lang.getCodeFixesAtPosition(
			key,
			span.start,
			span.start + span.length,
			errorCodes,
			{},
			{},
		);

		return fixes.map((f) => ({
			title: f.description,
			description: f.description,
			changes: f.changes,
		}));
	} catch (ex) {
		console.log("CODE ACTIONS ERROR:", ex);
		return [];
	}
}
