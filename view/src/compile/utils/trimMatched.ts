/**
 * Trims chars from the start and end of the supplied text when both the start and end match
 *
 * @param text The text to trim
 *
 * @returns The text without the chars at the start or the end
 */
export default function trimMatched(text: string, startChar: string, endChar: string) {
	let start = 0;
	let end = text.length;
	while (text[start] === startChar && text[end - 1] === endChar) {
		start += 1;
		end -= 1;
	}
	return text.substring(start, end);
}
