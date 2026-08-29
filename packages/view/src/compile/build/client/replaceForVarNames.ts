import endOfString from "../../utils/endOfString";
import type BuildStatus from "./BuildStatus";

/**
 * Variables used within a for loop need to be retrieved from the loop data.
 */
export default function replaceForVarNames(value: string, status: BuildStatus): string {
	// HACK: If a value from a for loop is used in the function body,
	// get it from the loop data to trigger an update when it is changed
	if (status.forVarNames.length === 0) {
		return value;
	}

	// Only rewrite code: the contents of string literals are left alone, so
	// that e.g. prose inside a template string is not mangled. The contents
	// of `${...}` interpolations inside template strings are code again.
	let result = "";
	let index = 0;
	for (let [start, end] of getCodeRanges(value)) {
		result += value.substring(index, start);
		result += replaceVarNames(value.substring(start, end), status);
		index = end;
	}
	result += value.substring(index);
	return result;
}

function replaceVarNames(code: string, status: BuildStatus): string {
	for (let varName of status.forVarNames) {
		code = code.replaceAll(
			new RegExp(
				// The boundary characters are the ones that can legitimately
				// precede/follow an identifier reference — including `?` for
				// optional chaining (`item?.name`) and nullish coalescing
				// (`fallback ?? item`).
				`(^|\\s|\\(|\\[|\\{|!|\\?|\\.\\.\\.)${varName[0]}($|\\s|\\.|,|\\(|\\)|\\[|\\]|\\}|;|\\?)`,
				"g",
			),
			`$1${varName[1]}$2`,
		);
	}
	return code;
}

/**
 * Returns the [start, end) ranges of `value` that are code — i.e. not the
 * contents of string literals or comments. Template string contents are
 * skipped, except for the contents of `${...}` interpolations, which are
 * code again.
 */
function getCodeRanges(value: string): [number, number][] {
	const ranges: [number, number][] = [];
	let codeStart = 0;
	let i = 0;
	while (i < value.length) {
		const next = skipStringOrComment(value, i, ranges, codeStart);
		if (next !== -1) {
			i = next;
			codeStart = i;
		} else {
			i += 1;
		}
	}
	pushRange(ranges, codeStart, value.length);
	return ranges;
}

/**
 * If the character at `i` starts a string literal or a comment, skips over
 * it (pushing the code range it interrupted, and collecting the code ranges
 * of any template string interpolations within) and returns the index just
 * after it. Returns -1 if the character doesn't start a string or comment.
 */
function skipStringOrComment(
	value: string,
	i: number,
	ranges: [number, number][],
	codeStart: number,
): number {
	const char = value[i];
	if (char === "'" || char === '"') {
		pushRange(ranges, codeStart, i);
		return endOfString(char, value, i) + 1;
	}
	if (char === "`") {
		pushRange(ranges, codeStart, i);
		return skipTemplateString(value, i, ranges);
	}
	if (char === "/" && value[i + 1] === "/") {
		// Line comment -- skip to the end of the line
		pushRange(ranges, codeStart, i);
		const end = value.indexOf("\n", i + 2);
		return end === -1 ? value.length : end;
	}
	if (char === "/" && value[i + 1] === "*") {
		// Block comment
		pushRange(ranges, codeStart, i);
		const end = value.indexOf("*/", i + 2);
		return end === -1 ? value.length : end + 2;
	}
	return -1;
}

/**
 * Skips over a template string, given the index of its opening backtick, and
 * returns the index just after the closing backtick. The contents of
 * `${...}` interpolations are code, so their ranges are collected — and
 * interpolations can contain nested strings and template strings, which are
 * skipped in turn.
 */
function skipTemplateString(value: string, start: number, ranges: [number, number][]): number {
	let i = start + 1;
	while (i < value.length) {
		const char = value[i];
		if (char === "\\") {
			// Skip escaped characters
			i += 2;
		} else if (char === "`") {
			return i + 1;
		} else if (char === "$" && value[i + 1] === "{") {
			i = endOfInterpolation(value, i + 2, ranges) + 1;
		} else {
			i += 1;
		}
	}
	return value.length;
}

/**
 * Skips over the code inside a `${...}` interpolation, given the index just
 * after the `${`, collecting its code ranges. Returns the index of the
 * matching `}`.
 */
function endOfInterpolation(value: string, start: number, ranges: [number, number][]): number {
	let level = 0;
	let codeStart = start;
	let i = start;
	while (i < value.length) {
		const char = value[i];
		if (char === "{") {
			level += 1;
			i += 1;
		} else if (char === "}") {
			if (level === 0) {
				pushRange(ranges, codeStart, i);
				return i;
			}
			level -= 1;
			i += 1;
		} else {
			const next = skipStringOrComment(value, i, ranges, codeStart);
			if (next !== -1) {
				i = next;
				codeStart = i;
			} else {
				i += 1;
			}
		}
	}
	pushRange(ranges, codeStart, value.length);
	return value.length;
}

function pushRange(ranges: [number, number][], start: number, end: number): void {
	if (end > start) {
		ranges.push([start, end]);
	}
}
