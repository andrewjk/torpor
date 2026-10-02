import Builder from "../../utils/Builder";
import forVarsReadIn from "../../utils/forVarsReadIn";
import type BuildStatus from "./BuildStatus";
import addPopDevBoundary from "./addPopDevBoundary";
import addPushDevBoundary from "./addPushDevBoundary";
import forVarBindings from "./forVars";

export default function buildRun(
	functionName: string,
	functionBody: string,
	status: BuildStatus,
	b: Builder,
): void {
	addPushDevBoundary("run", functionName, status, b);

	let forVarMask =
		status.forVars.length > 0 ? forVarsReadIn(functionBody, status.forVars) : undefined;
	functionBody = forVarBindings(status, functionBody) + functionBody;
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
