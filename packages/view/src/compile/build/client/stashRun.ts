import type SourceRange from "../../types/SourceRange";
import type Fragment from "../../types/nodes/Fragment";
import type BuildStatus from "./BuildStatus";
import replaceForVarNames from "./replaceForVarNames";

export default function stashRun(
	fragment: Fragment,
	functionStart: string,
	value: string,
	functionEnd: string,
	range: SourceRange,
	status: BuildStatus,
): void {
	value = replaceForVarNames(value, status);
	let functionBody = functionStart + value + functionEnd;
	fragment.effects.push({
		functionBody,
		ranges: [range],
		offsets: [functionStart.length],
		lengths: [value.length],
	});
}
