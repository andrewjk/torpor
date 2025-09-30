import { TextDocument } from "vscode-languageserver-textdocument";
import { LanguageService as HTMLLanguageService, LanguageMode, Position } from "../languageModes";

export function getHTMLMode(htmlLanguageService: HTMLLanguageService): LanguageMode {
	return {
		getId() {
			return "html";
		},
		doComplete(document: TextDocument, position: Position) {
			return htmlLanguageService.doComplete(
				document,
				position,
				htmlLanguageService.parseHTMLDocument(document),
			);

			// TODO: Add our things to the list, like components, special tags and special attributes
		},
		onDocumentRemoved(_document: TextDocument) {
			/* nothing to do */
		},
		dispose() {
			/* nothing to do */
		},
	};
}
