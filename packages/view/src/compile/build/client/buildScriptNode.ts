import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";

export default function buildScriptNode(node: ControlNode, b: Builder): void {
	b.append(`/* ${node.operation} */`);
	b.append(`${maybeAppend(node.statement, ";")}`);
}

function maybeAppend(text: string, end: string) {
	if (!text.endsWith(end)) {
		text += end;
	}
	return text;
}
