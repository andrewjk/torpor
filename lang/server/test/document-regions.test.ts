//import { beforeAll, assert.deepStrictEqual, test } from "vitest";
import * as assert from "node:assert";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getDocumentRegions } from "../src/embeddedSupport";

test("test document", () => {
	const doc1 = td(`
line 1
line 2`);
	assert.deepStrictEqual(doc1.positionAt(3), pos(1, 2));
	assert.deepStrictEqual(doc1.offsetAt(pos(1, 2)), 3);
});

test("script only", () => {
	const textDocument = td(`
export default () => {}
`);
	const regions = getDocumentRegions(textDocument).getLanguageRanges();
	assert.deepStrictEqual(regions, [{ languageId: "script", start: pos(0, 0), end: pos(2, 0) }]);
});

test("script with render", () => {
	const textDocument = td(`
export default () => {
	@render {
		<div />
	}
}
`);
	const regions = getDocumentRegions(textDocument).getLanguageRanges();
	assert.deepStrictEqual(regions, [
		{ languageId: "script", start: pos(0, 0), end: pos(2, 10) },
		{ languageId: "html", start: pos(2, 10), end: pos(4, 1) },
		{ languageId: "script", start: pos(4, 1), end: pos(6, 0) },
	]);
});

test("script with style", () => {
	const textDocument = td(`
export default () => {
	@style {
		p { color: green }
	}
}
`);
	const regions = getDocumentRegions(textDocument).getLanguageRanges();
	assert.deepStrictEqual(regions, [
		{ languageId: "script", start: pos(0, 0), end: pos(2, 9) },
		{ languageId: "css", start: pos(2, 9), end: pos(4, 1) },
		{ languageId: "script", start: pos(4, 1), end: pos(6, 0) },
	]);
});

test("script with render and style", () => {
	const textDocument = td(`
export default () => {
	@render {
		<div />
	}
	@style {
		p { color: green }
	}
}
`);
	const regions = getDocumentRegions(textDocument).getLanguageRanges();
	assert.deepStrictEqual(regions, [
		{ languageId: "script", start: pos(0, 0), end: pos(2, 10) },
		{ languageId: "html", start: pos(2, 10), end: pos(4, 1) },
		{ languageId: "script", start: pos(4, 1), end: pos(5, 9) },
		{ languageId: "css", start: pos(5, 9), end: pos(7, 1) },
		{ languageId: "script", start: pos(7, 1), end: pos(9, 0) },
	]);
});

test("script with render with reactive text", () => {
	const textDocument = td(`
export default () => {
	@render {
		<p>{greeting}</p>
	}
}
`);
	const regions = getDocumentRegions(textDocument).getLanguageRanges();
	assert.deepStrictEqual(regions, [
		{ languageId: "script", start: pos(0, 0), end: pos(2, 10) },
		{ languageId: "html", start: pos(2, 10), end: pos(3, 5) },
		{ languageId: "script", start: pos(3, 5), end: pos(3, 15) },
		{ languageId: "html", start: pos(3, 15), end: pos(4, 1) },
		{ languageId: "script", start: pos(4, 1), end: pos(6, 0) },
	]);
});

test("script with render with reactive attribute", () => {
	const textDocument = td(`
export default () => {
	@render {
		<p style={ps}>Hello</p>
	}
}
`);
	const regions = getDocumentRegions(textDocument).getLanguageRanges();
	assert.deepStrictEqual(regions, [
		{ languageId: "script", start: pos(0, 0), end: pos(2, 10) },
		{ languageId: "html", start: pos(2, 10), end: pos(3, 11) },
		{ languageId: "script", start: pos(3, 11), end: pos(3, 15) },
		{ languageId: "html", start: pos(3, 15), end: pos(4, 1) },
		{ languageId: "script", start: pos(4, 1), end: pos(6, 0) },
	]);
});

function td(source: string): TextDocument {
	return {
		uri: "",
		languageId: "torpor",
		version: 1,
		getText: (TextRange?) => source,
		positionAt: (offset) => {
			let line = 0;
			let lastLineStart = 0;
			for (let i = 0; i < Math.min(offset, source.length); i++) {
				if (source[i] === "\n") {
					line += 1;
					lastLineStart = i + 1;
				}
			}
			let character = offset - lastLineStart;
			return { line, character };
		},
		offsetAt: (position) => {
			let offset = 0;
			let line = 0;
			for (let i = 0; i < source.length; i++) {
				offset += 1;
				if (source[i] === "\n") {
					line += 1;
					if (line >= position.line) {
						break;
					}
				}
			}
			offset += position.character;
			return offset;
		},
		lineCount: source.split("\n").length,
	};
}

function pos(line: number, character: number) {
	return { line, character };
}
