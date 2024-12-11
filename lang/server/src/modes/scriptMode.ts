/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TextDocument } from "vscode-languageserver-textdocument";
import { TeraDocumentRegions } from "../embeddedSupport";
import { LanguageModelCache } from "../languageModelCache";
import { LanguageMode, LanguageService, Position } from "../languageModes";

export function getScriptMode(
	documentRegions: LanguageModelCache<TeraDocumentRegions>,
): LanguageMode {
	return {
		getId() {
			return "script";
		},
		//doComplete(document: TextDocument, position: Position) {
		//	/* TODO: JS completion?? */
		//},
		onDocumentRemoved(_document: TextDocument) {
			/* nothing to do */
		},
		dispose() {
			/* nothing to do */
		},
	};
}
