import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";
import replaceForVarNames from "./replaceForVarNames";

export default function buildMount(
	// TODO: like in buildRun
	_functionName: string,
	functionBody: string,
	status: BuildStatus,
	b: Builder,
): void {
	functionBody = replaceForVarNames(functionBody, status);

	status.imports.add("$onmount");
	// Ignore errors if the user hasn't returned a cleanup function
	b.append("// @ts-ignore\n$onmount(() => {");
	b.append(functionBody);
	b.append("});");
}
