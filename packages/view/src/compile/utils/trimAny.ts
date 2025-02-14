/**
 * Trims any of the supplied characters from the start and end of the supplied text
 *
 * @param text The text to trim
 * @param char The chars to remove from the start and end of the text
 *
 * @returns The text without the chars on the start and end
 */
export default function trimAny(text: string, chars: string): string {
	let start = 0;
	let end = text.length;
	while (start < end && chars.includes(text[start])) {
		start += 1;
	}
	while (end > start && chars.includes(text[end - 1])) {
		end -= 1;
	}
	return start > 0 || end < text.length ? text.substring(start, end) : text;
}
