import type ParseStatus from "../ParseStatus";

/**
 * Adds an error to the parse status
 *
 * @param status The parse status
 * @param message The error message to add
 * @param start (Optional) The start position of the error (defaults to the
 * current parse position)
 */
export default function addError(status: ParseStatus, message: string, start: number = status.i) {
	status.errors.push({ message, start });
}
