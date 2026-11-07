import type ScriptChunk from "../../types/ScriptChunk";
import { skipStringOrComment } from "../../utils/codeScanner";

export interface ScannedStateInit {
	/** The declared variable name, e.g. `$state` from `let $state = $watch(…)`. */
	name: string;
	/** The initializer source text (inside the `$watch(…)` parens). */
	initSource: string;
	/** Absolute source index where the initializer expression starts. */
	start: number;
}

/**
 * Matches `let|const|var <name> [type] = $watch(` at exactly the scan
 * position (sticky), tolerating a type annotation.
 */
const DECLARATION =
	/(?:let|const|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*[^=]+)?\s*=\s*\$watch\s*(?:<[^>(]*>)?\s*\(/y;

/**
 * Finds `let <name> = $watch(<initializer>)` declarations in a component's
 * script chunks (restricted mode's client state). Scans the code with
 * strings, comments and regex literals skipped — so a `$watch` inside a
 * string never matches — and returns each initializer source with its
 * absolute offset, so it can be parsed into a restricted expression with
 * correct error positions.
 */
export default function scanStateInitializers(chunks: ScriptChunk[]): ScannedStateInit[] {
	let text = "";
	const offsets: number[] = [];
	for (const chunk of chunks) {
		for (let i = 0; i < chunk.script.length; i++) {
			offsets.push(chunk.span.start + i);
		}
		text += chunk.script;
	}

	const results: ScannedStateInit[] = [];
	let i = 0;
	while (i < text.length) {
		const skipped = skipStringOrComment(text, i);
		if (skipped !== -1) {
			i = skipped;
			continue;
		}

		DECLARATION.lastIndex = i;
		const match = DECLARATION.exec(text);
		if (match === null || match.index !== i) {
			i += 1;
			continue;
		}

		const name = match[1];
		const open = i + match[0].length - 1;

		// Extract the balanced-parenthesis initializer. The scan runs over the
		// full text: parens inside string literals don't count (strings are
		// skipped wholesale).
		let level = 0;
		let close = -1;
		let j = open;
		while (j < text.length) {
			const skipped = skipStringOrComment(text, j);
			if (skipped !== -1) {
				j = skipped;
				continue;
			}
			if (text[j] === "(") level += 1;
			else if (text[j] === ")") {
				level -= 1;
				if (level === 0) {
					close = j;
					break;
				}
			}
			j += 1;
		}
		if (close === -1) break;

		const initStart = open + 1;
		results.push({
			name,
			initSource: text.substring(initStart, close),
			start: offsets[initStart] ?? i,
		});
		i = close;
	}
	return results;
}
