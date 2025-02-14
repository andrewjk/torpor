import { type ControlNode } from "./ControlNode";
import { type TemplateNode } from "./TemplateNode";

export default function isControlNode(node: TemplateNode): node is ControlNode {
	return node.type === "control";
}
