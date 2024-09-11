import ParseStatus from "./ParseStatus";
import { accept, consumeUntil, consumeUntilSequence } from "./parseUtils";

export default function parseInlineScript(status: ParseStatus): string {
	const start = status.i;
	let braceCount = 0;
	for (status.i; status.i < status.source.length; status.i++) {
		const char = status.source[status.i];
		if (char === "{") {
			braceCount += 1;
		} else if (char === "}") {
			if (braceCount === 0) {
				return status.source.substring(start, status.i);
			} else {
				braceCount -= 1;
			}
		} else if (char === '"' || char === "'" || char === "`") {
			// Ignore the content of strings
			do {
				consumeUntil(char, status);
			} while (status.source[status.i - 1] === "\\");
		} else if (accept("//", status)) {
			// Ignore the content of one-line comments
			consumeUntil("\n", status);
			accept("\n", status);
		} else if (accept("/*", status)) {
			// Ignore the content of multiple-line comments
			consumeUntilSequence("*/", status);
			accept("*/", status);
		}
	}
	return "";
}
