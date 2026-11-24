/**
 * Escapes raw-text content for inclusion in a generated template literal.
 *
 * Whitespace that would be altered by fragment-text whitespace collapsing is
 * escaped (`\n`, `\t`, `\x20` for runs of spaces), so raw content round-trips
 * exactly -- including line breaks and indentation inside scripts. Backticks
 * and `${` are escaped so the literal doesn't terminate or interpolate, and
 * backslashes are escaped so JavaScript escapes in the source text (e.g.
 * `"\n"` inside an inline script) aren't consumed by the template literal.
 */
export default function escapeRawText(text: string): string {
	let result = "";
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (char === "\\") {
			result += "\\\\";
		} else if (char === "`") {
			result += "\\x60";
		} else if (char === " ") {
			// A single space is already preserved by the collapse pass; runs
			// need escaping so they don't collapse to one
			let end = i + 1;
			while (text[end] === " ") end++;
			if (end - i > 1) {
				result += "\\x20".repeat(end - i);
				i = end - 1;
			} else {
				result += " ";
			}
		} else if (/\s/.test(char)) {
			result += whitespaceEscape(char);
		} else if (char === "$" && text[i + 1] === "{") {
			result += "\\x24";
		} else {
			result += char;
		}
	}
	return result;
}

function whitespaceEscape(char: string): string {
	switch (char) {
		case "\n":
			return "\\n";
		case "\r":
			return "\\r";
		case "\t":
			return "\\t";
		case "\f":
			return "\\f";
		case "\v":
			return "\\v";
		default:
			return `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`;
	}
}
