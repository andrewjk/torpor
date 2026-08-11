import Builder from "../../utils/Builder";
import forVarsReadIn from "../../utils/forVarsReadIn";
import type BuildStatus from "./BuildStatus";
import addPopDevBoundary from "./addPopDevBoundary";
import addPushDevBoundary from "./addPushDevBoundary";
import replaceForVarNames from "./replaceForVarNames";

export default function buildRun(
	functionName: string,
	functionBody: string,
	status: BuildStatus,
	b: Builder,
): void {
	functionBody = replaceForVarNames(functionBody, status);

	addPushDevBoundary("run", functionName, status, b);

	let forVarMask =
		status.forVarNames.length > 0 ? forVarsReadIn(functionBody, status.forVarNames) : undefined;
	let trailing = "";
	if (status.options.dev === true) {
		trailing = `, "${functionName}"`;
		if (forVarMask !== undefined) {
			trailing += `, { forVarMask: ${forVarMask} }`;
		}
	} else if (forVarMask !== undefined) {
		trailing = `, undefined, { forVarMask: ${forVarMask} }`;
	}

	status.imports.add("$run");
	b.append("$run(() => {");
	b.append(functionBody);
	b.append(`}${trailing});`);

	addPopDevBoundary(status, b);
}
