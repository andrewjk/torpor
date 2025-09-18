import type ControlNode from "../types/nodes/ControlNode";
import type TemplateNode from "../types/nodes/TemplateNode";

export default function isControlNode(node: TemplateNode): node is ControlNode {
	return node.type === "control";
}
