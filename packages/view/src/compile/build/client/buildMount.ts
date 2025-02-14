import Builder from "../../utils/Builder";
import { type BuildStatus } from "./BuildStatus";
import replaceForVarNames from "./replaceForVarNames";

export default function buildMount(
	functionName: string,
	functionBody: string,
	status: BuildStatus,
	b: Builder,
) {
	functionBody = replaceForVarNames(functionBody, status);

	status.imports.add("$mount");
	b.append(`$mount(function ${functionName}() {`);
	b.append(functionBody);
	b.append("});");
}
