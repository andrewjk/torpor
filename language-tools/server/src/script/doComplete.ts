import { type CompletionContext, type CompletionItem, type Position } from "vscode-languageserver";
import { type TextDocument } from "vscode-languageserver-textdocument";
import compiledIndexFromSourcePosition from "./compiledIndexFromSourcePosition";
import { loadDocument } from "./loadDocument";

export default function doComplete(
	document: TextDocument,
	position: Position,
	context?: CompletionContext,
) {
	try {
		const transformed = loadDocument(document);
		if (!transformed.ok) {
			return null;
		}
		const { key, text, map, vts: vfs } = transformed;

		let compiledIndex = compiledIndexFromSourcePosition(text, position, map);
		if (compiledIndex === -1) {
			return [];
		}

		const completions = vfs.lang.getCompletionsAtPosition(key, compiledIndex, {
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
