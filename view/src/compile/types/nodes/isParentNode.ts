import Node from "./Node";
import ParentNode from "./ParentNode";

export default function isParentNode(node: Node): node is ParentNode {
	return "children" in node;
}
