import type SourceSpan from "../../types/SourceSpan";
import type Fragment from "../../types/nodes/Fragment";
import forVarsReadIn from "../../utils/forVarsReadIn";
import type BuildStatus from "./BuildStatus";

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
	}

	let forVarMask =
		status.forVars.length > 0 ? forVarsReadIn(functionBody, status.forVars) : undefined;

	fragment.effects.push({
		functionBody,
		spans: spans,
		offsets,
		lengths,
		forVarMask,
	});
}
