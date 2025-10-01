import type SourceRange from "../../types/SourceRange";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";

export default function addMappedText(
	text: string,
	range: SourceRange,
	status: BuildStatus,
	b: Builder,
): void {
	if (status.options?.mapped) {
		let start = b.toString().length;
		b.append(text);
		let end = start + text.length;
		status.map.push({
			script: text,
			source: range,
			compiled: { start, end },
		});
	} else {
		b.append(text);
	}
}
