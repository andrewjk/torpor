import type ParseStatus from "../ParseStatus";

/**
 * Consumes a tag name, allowing letters, digits and dashes (custom elements
 * such as `<my-widget>`), and advances the current parse position to before
 * the next non-name character.
 *
 * @param status The parse status
 *
 * @returns The tag name from the current parse position to the next non-name
 * character
 */
export default function consumeTagName(status: ParseStatus): string {
	const start = status.i;
	for (status.i; status.i < status.source.length; status.i++) {
		const char = status.source[status.i];
		if (!/[A-Za-z0-9-]/.test(char)) {
			return status.source.substring(start, status.i);
		}
	}
	return status.source.substring(start, status.i);
}
