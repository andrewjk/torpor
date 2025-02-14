import { type ParentNode } from "./ParentNode";
import { type TemplateNode } from "./TemplateNode";

export default function isParentNode(node: TemplateNode): node is ParentNode {
	return "children" in node;
}
