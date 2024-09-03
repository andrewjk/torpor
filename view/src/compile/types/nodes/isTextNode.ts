import TemplateNode from "./TemplateNode";
import TextNode from "./TextNode";

export default function isTextNode(node: TemplateNode): node is TextNode {
	return node.type === "text";
}
