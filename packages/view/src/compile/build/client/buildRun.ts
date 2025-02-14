import Builder from "../../utils/Builder";
import { type BuildStatus } from "./BuildStatus";
import replaceForVarNames from "./replaceForVarNames";

export default function buildRun(
	functionName: string,
	functionBody: string,
	status: BuildStatus,
	b: Builder,
) {
	functionBody = replaceForVarNames(functionBody, status);

	status.imports.add("$run");
	b.append(`$run(function ${functionName}() {`);
	b.append(functionBody);
	b.append("});");
}
