import type ParseStatus from "../ParseStatus";

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
	end: number = status.i,
): void {
	let startLine = 0;
	let lastLineStart = 0;
	let i = 0;
	for (; i < start; i++) {
		if (status.source[i] === "\n") {
			startLine += 1;
			lastLineStart = i + 1;
		}
	}
	let startChar = start - lastLineStart;
	let endLine = startLine;
	for (; i < end; i++) {
		if (status.source[i] === "\n") {
			endLine += 1;
			lastLineStart = i + 1;
		}
	}
	let endChar = end - lastLineStart;
	status.errors.push({
		message,
		startIndex: start,
		startLine,
		startChar,
		endIndex: end,
		endLine,
		endChar,
	});
}
