import type TemplateNode from "./TemplateNode";
import type TextNode from "./TextNode";

export default function isTextNode(node: TemplateNode): node is TextNode {
	return node.type === "text";
}
