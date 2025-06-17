import { type ElementNode } from "./ElementNode";
import { type TemplateNode } from "./TemplateNode";

export default function isComponentNode(node: TemplateNode): node is ElementNode {
	return node.type === "component";
}
