import { type Position } from "vscode-languageserver";
import type SourceMap from "../script/SourceMap";

export default function compiledIndexFromSourcePosition(
	text: string,
	position: Position,
	map: SourceMap[],
): number {
	// Convert source position to source index
	// HACK: maybe we need to generate lineMaps
	let index = 0;
	let line = 0;
	for (; index < text.length; index++) {
		if (text[index] === "\n") {
			line++;
			if (line === position.line) {
				index += position.character + 1;
				break;
			}
		}
	}
	const mapped = map.find((m: any) => index >= m.source.start && index <= m.source.end);
	if (!mapped) {
		return -1;
	}
	return mapped.compiled.start + (index - mapped.source.start);
}
