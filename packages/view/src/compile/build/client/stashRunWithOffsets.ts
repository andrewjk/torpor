import type SourceSpan from "../../types/SourceSpan";
import type Fragment from "../../types/nodes/Fragment";
import type BuildStatus from "./BuildStatus";
import replaceForVarNames from "./replaceForVarNames";

export default function stashRunWithOffsets(
	fragment: Fragment,
	functionStart: string,
	value: string,
	functionEnd: string,
	spans: SourceSpan[],
	offsets: number[],
	lengths: number[],
	status: BuildStatus,
): void {
	let functionBody = functionStart + value + functionEnd;

	for (let i = 0; i < offsets.length; i++) {
		offsets[i] += functionStart.length;
		const oldLength = functionBody.length;
		functionBody =
			functionBody.substring(0, offsets[i]) +
			replaceForVarNames(functionBody.substring(offsets[i], offsets[i] + lengths[i]), status) +
			functionBody.substring(offsets[i] + lengths[i]);
		const changedLength = functionBody.length - oldLength;
		lengths[i] += changedLength;
		for (let j = i + 1; j < offsets.length; j++) {
			offsets[j] += changedLength;
		}
	}

	fragment.effects.push({
		functionBody,
		spans: spans,
		offsets,
		lengths,
	});
}
