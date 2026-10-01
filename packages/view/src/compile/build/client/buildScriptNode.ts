import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";
import addMappedText from "./addMappedText";
import { injectIntoFunctionBody } from "./forVars";

export default function buildScriptNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	b.append(`/* ${node.operation} */`);
	let text = maybeAppend(node.statement, ";");
	if (node.operation === "@function" || node.operation === "@async function") {
		text = injectIntoFunctionBody(text, status);
	}
	addMappedText("", text, "", node.span, status, b);
}

function maybeAppend(text: string, end: string) {
	if (!text.endsWith(end)) {
		text += end;
	}
	return text;
}
