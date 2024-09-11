import ParseStatus from "./ParseStatus";
import { accept } from "./parseUtils";

export default function parseInlineScript(status: ParseStatus): string {
	const start = status.i;
	let braceCount = 0;
	while (status.i < status.source.length) {
		if (accept("{", status)) {
			braceCount += 1;
		} else if (accept("}", status)) {
			if (braceCount > 0) {
				braceCount -= 1;
			} else {
				return status.source.substring(start, status.i - 1);
			}
		} else if (accept('"', status) || accept("'", status) || accept("`", status)) {
			// Ignore the content of strings
			const char = status.source[status.i - 1];
			do {
				status.i = status.source.indexOf(char, status.i) + 1;
			} while (status.source[status.i - 2] === "\\");
		} else if (accept("//", status)) {
			// Ignore the content of one-line comments
			status.i = status.source.indexOf("\n", status.i) + 1;
		} else if (accept("/*", status)) {
			// Ignore the content of multiple-line comments
			status.i = status.source.indexOf("*/", status.i) + 2;
		} else {
			status.i += 1;
		}
	}
	return "";
}
