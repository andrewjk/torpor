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
	let slice = status.source.slice(0, start);
	let line = 1;
	let lastLineStart = 0;
	for (let i = 0; i < slice.length; i++) {
		if (status.source[i] === "\n") {
			line += 1;
			lastLineStart = i;
		}
	}
	let column = start - lastLineStart - 1;
	status.errors.push({ message, start, line, column });
}
