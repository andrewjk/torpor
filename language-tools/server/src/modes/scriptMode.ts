import { TextDocument } from "vscode-languageserver-textdocument";
import { DocumentRegions } from "../embeddedSupport";
import { LanguageModelCache } from "../languageModelCache";
import { LanguageMode } from "../languageModes";
import doCodeAction from "../script/doCodeAction";
import doComplete from "../script/doComplete";
import doDefinition from "../script/doDefinition";
import doHover from "../script/doHover";
import doValidation from "../script/doValidation";

export function getScriptMode(_regions: LanguageModelCache<DocumentRegions>): LanguageMode {
	return {
		getId() {
			return "script";
		},
		doComplete,
		doCodeAction,
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
