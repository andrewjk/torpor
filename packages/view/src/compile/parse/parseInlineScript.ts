import type ParseStatus from "./ParseStatus";
import accept from "./utils/accept";
import { skipStringOrComment } from "../utils/codeScanner";

export default function parseInlineScript(status: ParseStatus): string {
	const start = status.i;
	let braceCount = 0;
	while (status.i < status.source.length) {
		const skipped = skipStringOrComment(status.source, status.i);
		if (skipped !== -1) {
			status.i = skipped;
			continue;
		}
		if (accept("{", status)) {
			braceCount += 1;
		} else if (accept("}", status)) {
			if (braceCount > 0) {
				braceCount -= 1;
			} else {
				return status.source.substring(start, status.i - 1);
			}
		} else {
			status.i += 1;
		}
	}
	return "";
}
