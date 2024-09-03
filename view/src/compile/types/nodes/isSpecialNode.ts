import ElementNode from "./ElementNode";
import TemplateNode from "./TemplateNode";

export default function isSpecialNode(node: TemplateNode): node is ElementNode {
	return node.type === "special";
}
