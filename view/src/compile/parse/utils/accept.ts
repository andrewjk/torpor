import type ParseStatus from "../ParseStatus";

/**
 * Checks whether the source at the current parse position matches the supplied
 * string
 *
 * @param value The string to check
 * @param status The parse status
 * @param advance (Optional) If true, advances the parse position past the
 * checked string (defaults to true)
 *
 * @returns True if the supplied string was found at the current parse position
 */
export default function accept(value: string, status: ParseStatus, advance = true): boolean {
	const check = status.source.substring(status.i, status.i + value.length);
	if (check == value) {
		status.i += advance ? value.length : 0;
		return true;
	}
	return false;
}
