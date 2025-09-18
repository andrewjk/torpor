import type ParseStatus from "../ParseStatus";

/**
 * Consumes characters until one of the characters in the supplied string is
 * found. The parse position will be advanced to before the found character
 *
 * @param chars The characters to match
 * @param status The parse status
 *
 * @returns The string of characters from the current parse position to the
 * found character
 */
export default function consumeUntil(chars: string, status: ParseStatus): string {
	const start = status.i;
	for (status.i; status.i < status.source.length; status.i++) {
		if (chars.includes(status.source[status.i])) {
			return status.source.substring(start, status.i);
		}
	}
	return "";
}
