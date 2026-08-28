import { type Range } from "vscode-css-languageservice";

export default function rangeFromSpan(text: string, start: number, end: number): Range {
	let line = 0;
	let lastLineStart = 0;
	let range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
	for (let i = 0; i < text.length; i++) {
		if (text[i] === "\n") {
			line++;
			lastLineStart = i;
		}
		if (i === start) {
			range.start.line = line;
			range.start.character = start - lastLineStart - 1;
		} else if (i === end) {
			range.end.line = line;
			range.end.character = end - lastLineStart - 1;
			break;
		}
	}
	return range;
}
