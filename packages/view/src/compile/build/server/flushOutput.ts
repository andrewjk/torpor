import type Builder from "../../utils/Builder";
import type BuildServerStatus from "./BuildServerStatus";

/**
 * Appends any pending output to the generated code, targeting the body
 * string -- or the head string, when building inside a @head block.
 */
export default function flushOutput(status: BuildServerStatus, b: Builder): void {
	if (status.output) {
		b.append(`${status.inHead ? "t_head" : "t_body"} += \`${status.output}\`;`);
		status.output = "";
	}
}
