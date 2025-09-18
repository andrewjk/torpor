import type ParentNode from "../types/nodes/ParentNode";
import type TemplateNode from "../types/nodes/TemplateNode";

export default function isParentNode(node: TemplateNode): node is ParentNode {
	return "children" in node;
}
