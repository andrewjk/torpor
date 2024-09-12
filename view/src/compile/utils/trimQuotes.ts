/**
 * Trims matching quotes from the start and end of the supplied text
 *
 * @param text The text to trim
 *
 * @returns The text without the quotes at the start or the end
 */
export function trimQuotes(text: string) {
	let start = 0;
	let end = text.length;
	while (
		(text[start] === "'" && text[end - 1] === "'") ||
		(text[start] === '"' && text[end - 1] === '"') ||
		(text[start] === "`" && text[end - 1] === "`")
	) {
		start += 1;
		end -= 1;
	}
	return text.substring(start, end);
}
