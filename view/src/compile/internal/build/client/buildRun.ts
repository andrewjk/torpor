import Builder from "../../Builder";
import type BuildStatus from "./BuildStatus";

export default function buildRun(
	functionName: string,
	functionBody: string,
	status: BuildStatus,
	b: Builder,
) {
	status.imports.add("$run");
	b.append(`$run(function ${functionName}() {`);
	// HACK: If a value from a for loop is used in the function body,
	// get it from the loop data to trigger an update when it is changed
	for (let varName of status.forVarNames) {
		functionBody = functionBody.replaceAll(
			new RegExp(`([\\s\\(\\[])${varName}([\\s\\.\\(\\)\\[\\];])`, "g"),
			`$1t_item.data.${varName}$2`,
		);
	}
	b.append(functionBody);
	b.append("});");
}
