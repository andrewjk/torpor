import { type ParseStatus } from "../ParseStatus";
import addError from "./addError";

/**
 * Checks whether the source at the current parse position matches the supplied
 * string and if not, adds an error to the parse status
 *
 * @param value The string to check
 * @param status The parse status
 * @param advance (Optional) If true, advances the parse position past the
 * checked string (defaults to true)
 *
 * @returns True if the supplied string was found at the current parse position
 */
export default function expect(value: string, status: ParseStatus, advance = true): boolean {
	if (status.i < status.source.length) {
		if (status.source.substring(status.i, status.i + value.length) == value) {
			status.i += advance ? value.length : 0;
			return true;
		} else {
			addError(status, `Expected ${value}`);
		}
	} else {
		addError(status, "Expected token");
	}
	return false;
}
