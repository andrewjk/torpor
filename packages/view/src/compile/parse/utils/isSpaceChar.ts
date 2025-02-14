/**
 * Checks whether the supplied character is a space
 *
 * @param text The string to check
 * @param index The index of the character in the string
 *
 * @returns True if the supplied character is a space
 */
export default function isSpaceChar(text: string, index: number) {
	let code = text.charCodeAt(index);
	return code === 32 || (code >= 9 && code <= 13);
}
