import type ElementNode from "../types/nodes/ElementNode";
import type TemplateNode from "../types/nodes/TemplateNode";
import isSpecialNode from "../utils/isSpecialNode";

/**
 * Moves any child nodes that aren't already in a <fill> node into a default
 * <fill> node
 */
export default function slottifyChildNodes(node: ElementNode): void {
	const nonFillNodes = node.children.filter((c) => !isFillNode(c));
	// TODO: Not if it's only spaces??
	if (nonFillNodes.length) {
		let defaultFillNode = node.children.find(
			(n) => isFillNode(n) && !n.attributes.find((a) => a.name === "name"),
		) as ElementNode | undefined;
		if (!defaultFillNode) {
			defaultFillNode = {
				type: "special",
				tagName: "fill",
				attributes: [],
				children: nonFillNodes,
				span: { start: 0, end: 0 },
			};
			node.children.unshift(defaultFillNode);
		}
	}
	node.children = node.children.filter((c) => isFillNode(c));
}

function isFillNode(n: TemplateNode): n is ElementNode {
	return isSpecialNode(n) && n.tagName === "fill";
}
