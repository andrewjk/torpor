import { skipStringOrComment } from "./codeScanner";

/**
 * Finds the `}` that closes the interpolation starting at the `{` at `start`,
 * skipping braces inside strings, template strings, comments and regex
 * literals. Returns -1 when the interpolation is not closed.
 */
export function findMatchingBrace(text: string, start: number): number {
	let level = 0;
	for (let i = start; i < text.length; i++) {
		const char = text[i];
		if (char === "{") {
			level += 1;
		} else if (char === "}") {
			level -= 1;
			if (level === 0) return i;
		} else {
			const skipped = skipStringOrComment(text, i);
			if (skipped !== -1) {
				i = skipped - 1;
			}
		}
	}
	return -1;
}

/**
 * Whether template text contains a complete `{...}` interpolation. Braces
 * inside the expression's strings, comments and regex literals aren't counted
 * as delimiters.
 */
export function hasInterpolation(text: string): boolean {
	for (let i = 0; i < text.length; i++) {
		if (text[i] !== "{") continue;
		return findMatchingBrace(text, i) !== -1;
	}
	return false;
}

/**
 * Whether the supplied text is exactly one `{...}` interpolation (ignoring
 * surrounding whitespace).
 */
export function isSingleInterpolation(text: string): boolean {
	const trimmed = text.trim();
	if (!trimmed.startsWith("{")) return false;
	return findMatchingBrace(trimmed, 0) === trimmed.length - 1;
}
