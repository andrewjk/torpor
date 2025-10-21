import type SourceSpan from "../../types/SourceSpan";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";

export default function addMappedText(
	preText: string,
	text: string,
	postText: string,
	span: SourceSpan,
	status: BuildStatus,
	b: Builder,
): void {
	if (status.options.mapped === true) {
		let start = b.toString().length + preText.length;
		b.append(preText + text + postText);
		let end = start + text.length;
		status.map.push({
			script: text,
			source: span,
			compiled: { start, end },
		});
	} else {
		b.append(preText + text + postText);
	}
}
