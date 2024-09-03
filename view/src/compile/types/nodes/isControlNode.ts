import ControlNode from "./ControlNode";
import TemplateNode from "./TemplateNode";

export default function isControlNode(node: TemplateNode): node is ControlNode {
	return node.type === "control";
}
