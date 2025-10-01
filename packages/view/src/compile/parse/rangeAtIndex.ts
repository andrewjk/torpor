import type SourceRange from "../types/SourceRange";
import type ParseStatus from "./ParseStatus";

// TODO: I think when parsing we should just return the start/end indexes, and
// only calculate line and char when necessary (in the extension, for example)

export default function rangeAtIndex(status: ParseStatus, start: number, end: number): SourceRange {
	const { lastRange, source } = status;
	let startIndex = lastRange.endIndex;
	let startLine = lastRange.endLine;
	let startChar = lastRange.endChar;
	for (; startIndex < start && startIndex < source.length; startIndex++) {
		if (source[startIndex] === "\n") {
			startLine++;
			startChar = 0;
		} else {
			startChar++;
		}
	}
	let endIndex = startIndex;
	let endLine = startLine;
	let endChar = startChar;
	for (; endIndex < end && endIndex < source.length; endIndex++) {
		if (source[endIndex] === "\n") {
			endLine++;
			endChar = 0;
		} else {
			endChar++;
		}
	}
	status.lastRange = {
		startIndex,
		startLine,
		startChar,
		endIndex,
		endLine,
		endChar,
	};
	return status.lastRange;
}
