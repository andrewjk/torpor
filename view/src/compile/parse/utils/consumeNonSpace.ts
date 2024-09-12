import type ParseStatus from "../ParseStatus";
import isSpaceChar from "./isSpaceChar";

/**
 * Consumes non-space characters and advances the current parse position to
 * before the next space character
 *
 * @param status The parse status
 *
 * @returns The string of non-space characters from the current parse position
 * to the next space character
 */
export default function consumeNonSpace(status: ParseStatus): string {
	const start = status.i;
	for (status.i; status.i < status.source.length; status.i++) {
		if (isSpaceChar(status.source, status.i)) {
			return status.source.substring(start, status.i);
		}
	}
	return "";
}
