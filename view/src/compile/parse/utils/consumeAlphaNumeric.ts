import { type ParseStatus } from "../ParseStatus";
import isAlphaNumericChar from "./isAlphaNumericChar";

/**
 * Consumes alpha-numeric characters and advances the current parse position to
 * before the next non-alpha character
 *
 * @param status The parse status
 *
 * @returns The string of alpha-numeric characters from the current parse position
 * to the next non-alpha character
 */
export default function consumeAlphaNumeric(status: ParseStatus): string {
	const start = status.i;
	for (status.i; status.i < status.source.length; status.i++) {
		if (!isAlphaNumericChar(status.source, status.i)) {
			return status.source.substring(start, status.i);
		}
	}
	return "";
}
