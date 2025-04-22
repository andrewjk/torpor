import { type ParseStatus } from "../ParseStatus";

/**
 * Adds an error to the parse status
 *
 * @param status The parse status
 * @param message The error message to add
 * @param start (Optional) The start position of the error (defaults to the
 * current parse position)
 */
export default function addError(
	status: ParseStatus,
	message: string,
	start: number = status.i,
): void {
	let line = 1;
	let lastLineStart = 0;
	for (let i = 0; i < start; i++) {
		if (status.source[i] === "\n") {
			line += 1;
			lastLineStart = i + 1;
		}
	}
	let column = start - lastLineStart;
	status.errors.push({ message, start, line, column });
}
