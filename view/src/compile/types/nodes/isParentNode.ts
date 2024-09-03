import ParentNode from "./ParentNode";
import TemplateNode from "./TemplateNode";

export default function isParentNode(node: TemplateNode): node is ParentNode {
	return "children" in node;
}
