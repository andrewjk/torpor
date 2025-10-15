import type SourceRange from "../../types/SourceRange";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";

export default function addMappedText(
	preText: string,
	text: string,
	postText: string,
	range: SourceRange,
	status: BuildStatus,
	b: Builder,
): void {
	if (status.options?.mapped) {
		let start = b.toString().length + preText.length;
		b.append(preText + text + postText);
		let end = start + text.length;
		status.map.push({
			script: text,
			source: range,
			compiled: { start, end },
		});
	} else {
		b.append(preText + text + postText);
	}
}
