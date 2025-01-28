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
		} else if (accept('"', status) || accept("'", status)) {
			// Skip string contents
			const char = status.source[status.i - 1];
			for (let j = status.i + 1; j < status.source.length; j++) {
				if (status.source[j] === char && status.source[j - 1] !== "\\") {
					status.i = j + 1;
					break;
				}
			}
		} else if (accept("`", status)) {
			// Skip possibly interpolated string contents
			const char = status.source[status.i - 1];
			let level2 = 0;
			for (let j = status.i + 1; j < status.source.length; j++) {
				if (status.source[j] === char && status.source[j - 1] !== "\\" && level2 === 0) {
					status.i = j + 1;
					break;
				} else if (status.source[j] === "{" && (level2 > 0 || status.source[j - 1] === "$")) {
					level2 += 1;
				} else if (status.source[j] === "}" && level2 > 0) {
					level2 -= 1;
				}
			}
		} else if (accept("//", status)) {
			// Ignore the content of one-line comments
			status.i = status.source.indexOf("\n", status.i) + 1;
		} else if (accept("/*", status)) {
			// Ignore the content of block comments
			status.i = status.source.indexOf("*/", status.i) + 2;
		} else {
			status.i += 1;
		}
	}
	return "";
}
