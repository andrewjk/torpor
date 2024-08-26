import { isSpace } from "../../internal/parse/parseUtils";
import Node from "./Node";
import TextNode from "./TextNode";
import isTextNode from "./isTextNode";

export default function isSpaceNode(node: Node): node is TextNode {
	return isTextNode(node) && isSpace(node.content);
}
