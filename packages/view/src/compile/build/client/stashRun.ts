import type SourceSpan from "../../types/SourceSpan";
import type Fragment from "../../types/nodes/Fragment";
import type BuildStatus from "./BuildStatus";
import replaceForVarNames from "./replaceForVarNames";

export default function stashRun(
	fragment: Fragment,
	functionStart: string,
	value: string,
	functionEnd: string,
	span: SourceSpan,
	status: BuildStatus,
): void {
	value = replaceForVarNames(value, status);
	let functionBody = functionStart + value + functionEnd;
	fragment.effects.push({
		functionBody,
		spans: [span],
		offsets: [functionStart.length],
		lengths: [value.length],
	});
}
