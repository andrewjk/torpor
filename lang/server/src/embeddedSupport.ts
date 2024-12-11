/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { LanguageService, Position, Range, TextDocument, TokenType } from "./languageModes";

export interface LanguageRange extends Range {
	languageId: string | undefined;
	attributeValue?: boolean;
}

export interface TeraDocumentRegions {
	getEmbeddedDocument(languageId: string, ignoreAttributeValues?: boolean): TextDocument;
	getLanguageRanges(range?: Range): LanguageRange[];
	getLanguageAtPosition(position: Position): string | undefined;
	getLanguagesInDocument(): string[];
	getImportedScripts(): string[];
}

export const CSS_STYLE_RULE = "__";

interface EmbeddedRegion {
	languageId: string | undefined;
	start: number;
	end: number;
	attributeValue?: boolean;
}

export function getDocumentRegions(document: TextDocument): TeraDocumentRegions {
	const regions: EmbeddedRegion[] = [];
	let documentText = document.getText();

	// TODO: We've built a small parser here, but we could merge this with the main Tera parser
	// TODO: Testing!
	let start = 0;
	for (let i = 0; i < documentText.length; i++) {
		const char = documentText[i];
		if (char === "/") {
			if (documentText[i + 1] === "/") {
				// Skip one-line comments
				i = documentText.indexOf("\n", i);
			} else if (documentText[i + 1] === "*") {
				// Skip block comments
				i = documentText.indexOf("*/", i) + 1;
			}
		} else if (char === '"' || char === "'") {
			// Skip string contents
			for (let j = i + 1; j < documentText.length; j++) {
				if (documentText[j] === char && documentText[j - 1] !== "\\") {
					i = j;
					break;
				}
			}
		} else if (char === "`") {
			// Skip possibly interpolated string contents
			let level = 0;
			for (let j = i + 1; j < documentText.length; j++) {
				if (documentText[j] === char && documentText[j - 1] !== "\\" && level === 0) {
					i = j;
					break;
				} else if (documentText[j] === "{" && (level > 0 || documentText[j - 1] === "$")) {
					level += 1;
				} else if (documentText[j] === "}" && level > 0) {
					level -= 1;
				}
			}
		} else if (char === "@") {
			// TODO: Regexes to account for space etc
			if (documentText.substring(i + 1).startsWith("render")) {
				let end = documentText.indexOf("{", i) + 1;
				if (end === -1) {
					end = documentText.length;
				}
				regions.push({ languageId: "script", start, end });
				start = end;

				start = i = getRenderRegions(start, documentText, regions);
			} else if (documentText.substring(i).startsWith("@style")) {
				let end = documentText.indexOf("{", i) + 1;
				if (end === -1) {
					end = documentText.length;
				}
				regions.push({ languageId: "script", start, end });
				start = end;

				start = i = getStyleRegions(start, documentText, regions);
			}
		}
	}

	return {
		getLanguageRanges: (range?: Range) => getLanguageRanges(document, regions, range),
		getEmbeddedDocument: (languageId: string, ignoreAttributeValues: boolean) =>
			getEmbeddedDocument(document, regions, languageId, ignoreAttributeValues),
		getLanguageAtPosition: (position: Position) =>
			getLanguageAtPosition(document, regions, position),
		getLanguagesInDocument: () => getLanguagesInDocument(document, regions),
		getImportedScripts: () => [],
	};
}

function getRenderRegions(start: number, documentText: string, regions: EmbeddedRegion[]): number {
	let end = documentText.length;
	for (let i = start; i < documentText.length; i++) {
		const char = documentText[i];
		if (char === "@") {
			let tail = documentText.substring(i + 1);
			if (tail.startsWith("//")) {
				// Skip one-line comments
				i = documentText.indexOf("\n", i);
			} else if (tail.startsWith("/*")) {
				// Skip block comments
				i = documentText.indexOf("*/", i) + 1;
			}
			// TODO: @if etc
		} else if (char === "<" && documentText.substring(i + 1).startsWith("!--")) {
			// Skip HTML comments
			i = documentText.indexOf("-->", i) + 2;
		} else if (char === '"' || char === "'") {
			// Skip string contents
			for (let j = i + 1; j < documentText.length; j++) {
				if (documentText[j] === char && documentText[j - 1] !== "\\") {
					i = j;
					break;
				}
			}
		} else if (char === "{") {
			regions.push({ languageId: "html", start, end: i });
			start = i = getScriptRegion(i, documentText, regions);
		} else if (char === "}") {
			end = i;
			regions.push({ languageId: "html", start, end });
			break;
		}
	}
	return end;
}

function getStyleRegions(start: number, documentText: string, regions: EmbeddedRegion[]): number {
	let level = 1;
	let end = documentText.length;
	for (let i = start; i < documentText.length; i++) {
		const char = documentText[i];
		// TODO: Properly support one-line comments in CSS
		if (char === "@") {
			let tail = documentText.substring(i + 1);
			if (tail.startsWith("//")) {
				// Skip one-line comments
				i = documentText.indexOf("\n", i);
			} else if (tail.startsWith("/*")) {
				// Skip block comments
				i = documentText.indexOf("*/", i) + 1;
			}
		} else if (char === "/") {
			if (documentText[i + 1] === "/") {
				// Skip one-line comments
				i = documentText.indexOf("\n", i);
			} else if (documentText[i + 1] === "*") {
				// Skip block comments
				i = documentText.indexOf("*/", i) + 1;
			}
		} else if (char === "{") {
			level += 1;
		} else if (char === "}") {
			level -= 1;
			if (level === 0) {
				end = i;
				regions.push({ languageId: "css", start, end });
				break;
			}
		}
	}
	return end;
}

function getScriptRegion(start: number, documentText: string, regions: EmbeddedRegion[]): number {
	let end = documentText.length;
	let level = 0;
	for (let i = start; i < documentText.length; i++) {
		const char = documentText[i];
		if (char === "/") {
			if (documentText[i + 1] === "/") {
				// Skip one-line comments
				i = documentText.indexOf("\n", i);
			} else if (documentText[i + 1] === "*") {
				// Skip block comments
				i = documentText.indexOf("*/", i) + 1;
			}
		} else if (char === '"' || char === "'") {
			// Skip string contents
			for (let j = i + 1; j < documentText.length; j++) {
				if (documentText[j] === char && documentText[j - 1] !== "\\") {
					i = j;
					break;
				}
			}
		} else if (char === "`") {
			// Skip possibly interpolated string contents
			let level2 = 0;
			for (let j = i + 1; j < documentText.length; j++) {
				if (documentText[j] === char && documentText[j - 1] !== "\\" && level2 === 0) {
					i = j;
					break;
				} else if (documentText[j] === "{" && (level2 > 0 || documentText[j - 1] === "$")) {
					level2 += 1;
				} else if (documentText[j] === "}" && level2 > 0) {
					level2 -= 1;
				}
			}
		} else if (char === "{") {
			level += 1;
		} else if (char === "}") {
			level -= 1;
			if (level === 0) {
				end = i + 1;
				break;
			}
		}
	}
	regions.push({ languageId: "script", start, end });
	return end;
}

function getLanguageRanges(
	document: TextDocument,
	regions: EmbeddedRegion[],
	range?: Range,
): LanguageRange[] {
	const result: LanguageRange[] = [];
	let currentPos = range ? range.start : Position.create(0, 0);
	let currentOffset = range ? document.offsetAt(range.start) : 0;
	const endOffset = range ? document.offsetAt(range.end) : document.getText().length;
	for (const region of regions) {
		if (region.end > currentOffset && region.start < endOffset) {
			const start = Math.max(region.start, currentOffset);
			const startPos = document.positionAt(start);
			if (currentOffset < region.start) {
				result.push({
					start: currentPos,
					end: startPos,
					languageId: "script",
				});
			}
			const end = Math.min(region.end, endOffset);
			const endPos = document.positionAt(end);
			if (end > region.start) {
				result.push({
					start: startPos,
					end: endPos,
					languageId: region.languageId,
					//attributeValue: region.attributeValue,
				});
			}
			currentOffset = end;
			currentPos = endPos;
		}
	}
	if (currentOffset < endOffset) {
		const endPos = range ? range.end : document.positionAt(endOffset);
		result.push({
			start: currentPos,
			end: endPos,
			languageId: "script",
		});
	}
	return result;
}

function getLanguagesInDocument(_document: TextDocument, regions: EmbeddedRegion[]): string[] {
	const result: string[] = [];
	for (const region of regions) {
		if (region.languageId && !result.includes(region.languageId)) {
			result.push(region.languageId);
			if (result.length === 3) {
				return result;
			}
		}
	}
	//result.push("script");
	return result;
}

function getLanguageAtPosition(
	document: TextDocument,
	regions: EmbeddedRegion[],
	position: Position,
): string | undefined {
	const offset = document.offsetAt(position);
	for (const region of regions) {
		if (region.start <= offset) {
			if (offset <= region.end) {
				return region.languageId;
			}
		} else {
			break;
		}
	}
	return "script";
}

function getEmbeddedDocument(
	document: TextDocument,
	contents: EmbeddedRegion[],
	languageId: string,
	ignoreAttributeValues: boolean,
): TextDocument {
	let currentPos = 0;
	const oldContent = document.getText();
	let result = "";
	let lastSuffix = "";
	for (const c of contents) {
		if (c.languageId === languageId && (!ignoreAttributeValues || !c.attributeValue)) {
			result = substituteWithWhitespace(
				result,
				currentPos,
				c.start,
				oldContent,
				lastSuffix,
				getPrefix(c),
			);
			result += oldContent.substring(c.start, c.end);
			currentPos = c.end;
			lastSuffix = getSuffix(c);
		}
	}
	result = substituteWithWhitespace(
		result,
		currentPos,
		oldContent.length,
		oldContent,
		lastSuffix,
		"",
	);
	return TextDocument.create(document.uri, languageId, document.version, result);
}

function getPrefix(c: EmbeddedRegion) {
	if (c.attributeValue) {
		switch (c.languageId) {
			case "css":
				return CSS_STYLE_RULE + "{";
		}
	}
	return "";
}
function getSuffix(c: EmbeddedRegion) {
	if (c.attributeValue) {
		switch (c.languageId) {
			case "css":
				return "}";
			case "script":
				return ";";
		}
	}
	return "";
}

function substituteWithWhitespace(
	result: string,
	start: number,
	end: number,
	oldContent: string,
	before: string,
	after: string,
) {
	let accumulatedWS = 0;
	result += before;
	for (let i = start + before.length; i < end; i++) {
		const ch = oldContent[i];
		if (ch === "\n" || ch === "\r") {
			// only write new lines, skip the whitespace
			accumulatedWS = 0;
			result += ch;
		} else {
			accumulatedWS++;
		}
	}
	result = append(result, " ", accumulatedWS - after.length);
	result += after;
	return result;
}

function append(result: string, str: string, n: number): string {
	while (n > 0) {
		if (n & 1) {
			result += str;
		}
		n >>= 1;
		str += str;
	}
	return result;
}
