import type ElementNode from "../types/nodes/ElementNode";
import type TemplateNode from "../types/nodes/TemplateNode";

export default function isSpecialNode(node: TemplateNode): node is ElementNode {
	return node.type === "special";
}
