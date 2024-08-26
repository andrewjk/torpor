import Node from "./Node";
import TextNode from "./TextNode";

export default function isTextNode(node: Node): node is TextNode {
	return node.type === "text";
}
