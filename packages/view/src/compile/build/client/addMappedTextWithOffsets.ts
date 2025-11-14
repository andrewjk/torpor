import type SourceSpan from "../../types/SourceSpan";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";

export default function addMappedTextWithOffsets(
	preText: string,
	text: string,
	postText: string,
	spans: SourceSpan[],
	offsets: number[],
	lengths: number[],
	status: BuildStatus,
	b: Builder,
): void {
	if (status.options.mapped === true) {
		let mappedStart = b.toString().length + preText.length;
		let functionBody = preText + text + postText;
		b.append(functionBody);
		for (let i = 0; i < spans.length; i++) {
			let start = mappedStart + offsets[i];
			let end = start + lengths[i];
			status.map.push({
				script: functionBody,
				source: spans[i],
				compiled: { start, end },
			});
		}
	} else {
		b.append(preText + text + postText);
	}
}
