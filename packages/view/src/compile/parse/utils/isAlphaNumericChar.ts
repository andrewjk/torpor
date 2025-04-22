/**
 * Checks whether the supplied character is a alpha-numeric
 *
 * @param text The string to check
 * @param index The index of the character in the string
 *
 * @returns True if the supplied character is alpha-numeric
 */
export default function isAlphaNumericChar(text: string, index: number): boolean {
	let code = text.charCodeAt(index);
	return (
		// 0-9
		(code > 47 && code < 58) ||
		// A-Z
		(code > 64 && code < 91) ||
		// a-z
		(code > 96 && code < 123)
	);
}
