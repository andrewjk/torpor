import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";
import addMappedText from "./addMappedText";

export default function buildScriptNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	b.append(`/* ${node.operation} */`);
	addMappedText(`${maybeAppend(node.statement, ";")}`, node.range, status, b);
}

function maybeAppend(text: string, end: string) {
	if (!text.endsWith(end)) {
		text += end;
	}
	return text;
}
