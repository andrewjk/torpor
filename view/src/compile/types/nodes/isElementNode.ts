import ElementNode from "./ElementNode";
import TemplateNode from "./TemplateNode";

export default function isElementNode(node: TemplateNode): node is ElementNode {
	return node.type === "element";
}
