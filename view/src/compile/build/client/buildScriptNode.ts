import Builder from "../../Builder";
import type ControlNode from "../../types/nodes/ControlNode";

export default function buildScriptNode(node: ControlNode, b: Builder) {
	b.append(`/* ${node.operation} */`);
	b.append(`${maybeAppend(node.statement, ";")}`);
}

function maybeAppend(text: string, end: string) {
	if (!text.endsWith(end)) {
		text += end;
	}
	return text;
}
