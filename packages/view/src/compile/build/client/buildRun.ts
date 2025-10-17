import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";
import addDevBoundary from "./addDevBoundary";
import replaceForVarNames from "./replaceForVarNames";

export default function buildRun(
	functionName: string,
	functionBody: string,
	status: BuildStatus,
	b: Builder,
): void {
	functionBody = replaceForVarNames(functionBody, status);

	addDevBoundary(`$run(${functionName})`, status, b);

	status.imports.add("$run");
	b.append("$run(() => {");
	b.append(functionBody);
	b.append(`}${status.options.dev === true ? `, "${functionName}"` : ""});`);
}
