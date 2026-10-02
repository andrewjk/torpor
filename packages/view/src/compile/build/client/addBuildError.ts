import type CompileError from "../../types/CompileError";
import type BuildStatus from "./BuildStatus";

/**
 * Adds an error to the build status. Mirrors `parse/utils/addError`, but is
 * used during building (where loop-variable write rules, etc. are enforced).
 *
 * Line/char are derived from `status.options.source` when it is available;
 * when it isn't, they default to 0 and consumers should rely on `startIndex`.
 */
export default function addBuildError(
	status: BuildStatus,
	message: string,
	start: number,
	end: number = start,
): void {
	const source = status.options.source;
	let startLine = 0;
	let lastLineStart = 0;
	let i = 0;
	if (source !== undefined) {
		for (; i < start && i < source.length; i++) {
			if (source[i] === "\n") {
				startLine += 1;
				lastLineStart = i + 1;
			}
		}
	}
	const startChar = start - lastLineStart;
	let endLine = startLine;
	for (; i < end && source !== undefined && i < source.length; i++) {
		if (source[i] === "\n") {
			endLine += 1;
			lastLineStart = i + 1;
		}
	}
	const error: CompileError = {
		message,
		startIndex: start,
		startLine,
		startChar,
		endIndex: end,
		endLine,
		endChar: end - lastLineStart,
	};
	status.errors.push(error);
}
