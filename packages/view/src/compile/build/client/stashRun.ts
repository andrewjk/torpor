import type SourceSpan from "../../types/SourceSpan";
import type Fragment from "../../types/nodes/Fragment";
import forVarsReadIn from "../../utils/forVarsReadIn";
import type BuildStatus from "./BuildStatus";

export default function stashRun(
	fragment: Fragment,
	functionStart: string,
	value: string,
	functionEnd: string,
	span: SourceSpan,
	status: BuildStatus,
): void {
	let functionBody = functionStart + value + functionEnd;
	let forVarMask = status.forVars.length > 0 ? forVarsReadIn(value, status.forVars) : undefined;
	fragment.effects.push({
		functionBody,
		spans: [span],
		offsets: [functionStart.length],
		lengths: [value.length],
		forVarMask,
	});
}
