import endOfString from "../utils/endOfString";
import endOfTemplateString from "../utils/endOfTemplateString";
import { type ParseStatus } from "./ParseStatus";
import accept from "./utils/accept";

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
		} else if (accept("//", status)) {
			// Skip one-line comments
			status.i = status.source.indexOf("\n", status.i) + 1;
		} else if (accept("/*", status)) {
			// Skip block comments
			status.i = status.source.indexOf("*/", status.i) + 2;
		} else if (accept('"', status) || accept("'", status)) {
			// Skip string contents
			const char = status.source[status.i - 1];
			status.i = endOfString(char, status.source, status.i - 1) + 1;
		} else if (accept("`", status)) {
			// Skip template string contents
			status.i = endOfTemplateString(status.source, status.i - 1) + 1;
		} else {
			status.i += 1;
		}
	}
	return "";
}
