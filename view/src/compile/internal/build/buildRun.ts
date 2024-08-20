import Builder from "../Builder";
import type BuildStatus from "./BuildStatus";

export default function buildRun(
  functionName: string,
  functionBody: string,
  status: BuildStatus,
  b: Builder,
) {
  b.append(`$run(function ${functionName}() {`);
  // If a value from a for loop is used in the function body, get it from the
  // loop data to trigger an update when it is changed
  // We could potentially directly replace using the regex? Might introduce issues though
  for (let varName of status.forVarNames) {
    if (new RegExp(`\\b${varName}\\b`).test(functionBody)) {
      b.append(`let ${varName} = t_item.data.${varName}; `);
    }
  }
  b.append(functionBody);
  b.append("});");
}
