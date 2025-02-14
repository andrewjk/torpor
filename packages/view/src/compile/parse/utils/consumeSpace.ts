import { type ParseStatus } from "../ParseStatus";
import isSpaceChar from "./isSpaceChar";

/**
 * Consumes space characters and advances the current parse position to before
 * the next non-space character
 *
 * @param status The parse status
 *
 * @returns The string of space characters from the current parse position to
 * the next non-space character
 */
export default function consumeSpace(status: ParseStatus): string {
	const start = status.i;
	for (status.i; status.i < status.source.length; status.i++) {
		if (!isSpaceChar(status.source, status.i)) {
			return status.source.substring(start, status.i);
		}
	}
	return "";
}
