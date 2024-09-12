/**
 * Trims a char from the start of the supplied text
 *
 * @param text The text to trim
 * @param char The char to remove from the start of the text
 *
 * @returns The text without the char on the start
 */
export default function trimStart(text: string, char: string) {
	let start = 0;
	while (text[start] === char) {
		start += 1;
	}
	return text.substring(start);
}
