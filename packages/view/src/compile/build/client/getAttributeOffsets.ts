import type SourceSpan from "../../types/SourceSpan";
import { skipStringOrComment } from "../../utils/codeScanner";
import trimQuotes from "../../utils/trimQuotes";

export default function getAttributeOffsets(
	value: string,
	span: SourceSpan,
): {
	newValue: string;
	spans: SourceSpan[];
	offsets: number[];
	lengths: number[];
} {
	// Build offsets for interpolated values e.g. attribute="value {x}
	// and {y}" should have offsets for where the x and y are
	// interpolated into the output
	value = trimQuotes(value);
	let spans: SourceSpan[] = [];
	let offsets: number[] = [];
	let lengths: number[] = [];

	let textContent = "";
	let reactiveStart = 0;
	let level = 0;
	for (let i = 0; i < value.length; i++) {
		const char = value[i];
		if (char === "{") {
			level++;
			//maxLevel = Math.max(level, maxLevel);
			if (level === 1) {
				//reactiveCount += 1;
				textContent += "${";
				reactiveStart = textContent.length;
				// 2 is for the start quote plus the new `$`
				spans.push({ start: span.start + i + 2, end: -1 });
				offsets.push(reactiveStart + 1);
				continue;
			}
		} else if (char === "}") {
			level--;
			if (level === 0) {
				// 2 is for the start quote plus the new `$`
				spans.at(-1)!.end = span.start + i + 2;
				lengths.push(textContent.length - reactiveStart);
				textContent += "}";
				continue;
			}
		} else if (char === "`" && level === 0) {
			// Escape backticks outside of braces, as they will be within a backtick string
			textContent += "\\";
		} else if (level > 0) {
			const skipped = skipStringOrComment(value, i);
			if (skipped !== -1) {
				// Copy strings, template strings, comments and regex literals
				// into the output as-is
				textContent += value.substring(i, skipped);
				i = skipped - 1;
				continue;
			}
		}
		textContent += value[i];
	}
	value = `\`${textContent}\``;

	return {
		newValue: value,
		spans,
		offsets,
		lengths,
	};
}
