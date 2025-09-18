import type TemplateNode from "../types/nodes/TemplateNode";
import type TextNode from "../types/nodes/TextNode";

export default function isTextNode(node: TemplateNode): node is TextNode {
	return node.type === "text";
}
