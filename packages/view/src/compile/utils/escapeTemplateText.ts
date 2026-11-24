/**
 * Escapes text for inclusion in a generated template literal: backslashes,
 * backticks and `${` are all written as escapes so the text round-trips
 * literally instead of ending the literal or starting an interpolation.
 */
export function escapeTemplateText(text: string): string {
	let result = "";
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (char === "\\") {
			result += "\\\\";
		} else if (char === "`") {
			result += "\\x60";
		} else if (char === "$" && text[i + 1] === "{") {
			result += "\\x24";
		} else {
			result += char;
		}
	}
	return result;
}
