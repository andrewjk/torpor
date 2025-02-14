/**
 * Trims a char from the end of the supplied text
 *
 * @param text The text to trim
 * @param char The char to remove from the end of the text
 *
 * @returns The text without the char on the end
 */
export default function trimEnd(text: string, char: string) {
	let end = text.length;
	while (text[end - 1] === char) {
		end -= 1;
	}
	return text.substring(0, end);
}
