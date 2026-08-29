import endOfString from "./endOfString";

/**
 * Shared scanner for skipping over non-code parts of JavaScript expression
 * text: string literals, template literals (including their interpolations),
 * comments, and regex literals. Used everywhere the compiler scans
 * expression text and needs to tell code from literal text.
 *
 * Note: this is for *code* contexts. For torpor template text (where quotes
 * are literal characters and `{...}` are interpolation delimiters), use this
 * only for the *interiors* of `{...}` expressions -- the template level
 * itself has different rules.
 */

// Keywords after which a `/` starts a regex literal, even though the
// previous character is an identifier character
const REGEX_KEYWORDS = new Set([
	"return",
	"typeof",
	"instanceof",
	"in",
	"of",
	"new",
	"delete",
	"void",
	"throw",
	"case",
	"do",
	"else",
	"yield",
	"await",
]);

/**
 * If the character at `start` begins a string literal, a template literal, a
 * comment (line or block), or a regex literal, returns the index just after
 * it. Returns -1 if it doesn't (a `/` that is division, or any other
 * character).
 */
export function skipStringOrComment(value: string, start: number): number {
	return skipInRange(value, start);
}

/**
 * Returns the [start, end) ranges of `value` that are code -- i.e. not the
 * contents of string literals, regex literals, or comments. Template string
 * contents are skipped, except for the contents of `${...}` interpolations,
 * which are code again.
 */
export function codeRanges(value: string): [number, number][] {
	const ranges: [number, number][] = [];
	let codeStart = 0;
	let i = 0;
	while (i < value.length) {
		const next = skipInRange(value, i, ranges, codeStart);
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
 * `skipStringOrComment` with optional collection of the interrupted code
 * range (for `codeRanges`), so there is a single implementation of the scan
 * order.
 */
function skipInRange(
	value: string,
	start: number,
	ranges?: [number, number][],
	codeStart?: number,
): number {
	const char = value[start];
	if (char === "'" || char === '"') {
		if (ranges) pushRange(ranges, codeStart!, start);
		return endOfString(char, value, start) + 1;
	}
	if (char === "`") {
		if (ranges) pushRange(ranges, codeStart!, start);
		return skipTemplateString(value, start, ranges);
	}
	if (char === "/" && value[start + 1] === "/") {
		if (ranges) pushRange(ranges, codeStart!, start);
		const end = value.indexOf("\n", start + 2);
		return end === -1 ? value.length : end;
	}
	if (char === "/" && value[start + 1] === "*") {
		if (ranges) pushRange(ranges, codeStart!, start);
		const end = value.indexOf("*/", start + 2);
		return end === -1 ? value.length : end + 2;
	}
	if (char === "/" && isRegexPosition(value, start)) {
		if (ranges) pushRange(ranges, codeStart!, start);
		return skipRegexLiteral(value, start);
	}
	return -1;
}

/**
 * Skips over a template string, given the index of its opening backtick, and
 * returns the index just after the closing backtick. Handles escaped
 * characters, and scans `${...}` interpolations correctly (nested strings,
 * templates, comments and regexes within them can't desync the scan).
 */
function skipTemplateString(value: string, start: number, ranges?: [number, number][]): number {
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
 * after the `${`, collecting its code ranges when provided. Returns the
 * index of the matching `}`.
 */
function endOfInterpolation(value: string, start: number, ranges?: [number, number][]): number {
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
			const next = skipInRange(value, i, ranges, codeStart);
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

/**
 * Decides whether the `/` at `slashIndex` starts a regex literal (rather
 * than being division), by looking at the previous significant character.
 * The standard lexical heuristic -- not a full parse, but correct for
 * real-world code.
 */
function isRegexPosition(value: string, slashIndex: number): boolean {
	let i = slashIndex - 1;
	while (i >= 0) {
		const char = value[i];
		if (char === " " || char === "\t" || char === "\n" || char === "\r") {
			i -= 1;
		} else if (char === "/" && value[i - 1] === "*") {
			// Step back over a block comment
			const open = value.lastIndexOf("/*", i - 2);
			if (open === -1) {
				return true;
			}
			i = open - 1;
		} else {
			break;
		}
	}
	if (i < 0) {
		// Start of the expression
		return true;
	}
	const char = value[i];
	if (
		char === ")" ||
		char === "]" ||
		char === "}" ||
		char === '"' ||
		char === "'" ||
		char === "`"
	) {
		// After a completed value -- division
		return false;
	}
	if (/[a-z0-9_$]/i.test(char)) {
		// After an identifier or number -- division, unless it's a keyword
		// that can be followed by an expression
		let wordStart = i;
		while (wordStart >= 0 && /[a-z0-9_$]/i.test(value[wordStart])) {
			wordStart -= 1;
		}
		return REGEX_KEYWORDS.has(value.substring(wordStart + 1, i + 1));
	}
	if (char === "+" || char === "-") {
		// `a++ / 2` is division (postfix update); `x + /re/` is a regex
		if (value[i - 1] === char) {
			const before = value[i - 2];
			return !(before && /[a-z0-9_$)\]]/i.test(before));
		}
		return true;
	}
	// After any other operator or punctuation -- regex
	return true;
}

/**
 * Skips over a regex literal, given the index of its opening `/`, and
 * returns the index just after its flags. Returns -1 if the literal is
 * unterminated (in which case the `/` is treated as division).
 */
function skipRegexLiteral(value: string, start: number): number {
	let i = start + 1;
	let inClass = false;
	while (i < value.length) {
		const char = value[i];
		if (char === "\\") {
			i += 2;
		} else if (char === "\n") {
			// Unterminated regex -- treat the `/` as division
			return -1;
		} else if (char === "[") {
			inClass = true;
			i += 1;
		} else if (char === "]") {
			inClass = false;
			i += 1;
		} else if (char === "/" && !inClass) {
			// Skip flags
			i += 1;
			while (i < value.length && /[a-z]/i.test(value[i])) {
				i += 1;
			}
			return i;
		} else {
			i += 1;
		}
	}
	return -1;
}

function pushRange(ranges: [number, number][] | undefined, start: number, end: number): void {
	if (ranges && end > start) {
		ranges.push([start, end]);
	}
}
