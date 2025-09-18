import type Fragment from "../../types/nodes/Fragment";
import type BuildStatus from "./BuildStatus";
import replaceForVarNames from "./replaceForVarNames";

export default function stashRun(
	fragment: Fragment,
	functionBody: string,
	status: BuildStatus,
): void {
	functionBody = replaceForVarNames(functionBody, status);
	fragment.effects.push(functionBody);
}
