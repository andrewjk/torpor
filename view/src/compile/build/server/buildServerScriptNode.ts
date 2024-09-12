import Builder from "../../Builder";
import type ControlNode from "../../types/nodes/ControlNode";

export default function buildServerScriptNode(node: ControlNode, b: Builder) {
	b.append(`${maybeAppend(node.statement, ";")}`);
}

function maybeAppend(text: string, end: string) {
	if (!text.endsWith(end)) {
		text += end;
	}
	return text;
}
