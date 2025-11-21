import { type Range } from "vscode-languageserver";

export default function sourceSpanFromSourceRange(text: string, range: Range) {
	// HACK: maybe we need to generate lineMaps
	let start = 0;
	let end = 0;
	let line = 0;
	for (let i = 0; i < text.length; i++) {
		if (text[i] === "\n") {
			line++;
			if (line === range.start.line) {
				start = i + range.start.character;
			}
			if (line === range.end.line) {
				end = i + range.end.character;
				break;
			}
		}
	}
	return { start, length: end - start };
}
