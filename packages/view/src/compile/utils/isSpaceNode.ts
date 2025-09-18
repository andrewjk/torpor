import isSpace from "../parse/utils/isSpace";
import type TemplateNode from "../types/nodes/TemplateNode";
import type TextNode from "../types/nodes/TextNode";
import isTextNode from "./isTextNode";

export default function isSpaceNode(node: TemplateNode): node is TextNode {
	return isTextNode(node) && isSpace(node.content);
}
