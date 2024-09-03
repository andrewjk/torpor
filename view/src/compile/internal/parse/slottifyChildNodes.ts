import type ElementNode from "../../types/nodes/ElementNode";
import type Node from "../../types/nodes/Node";
import isSpecialNode from "../../types/nodes/isSpecialNode";

/**
 * Moves any child nodes that aren't already in a <:fill> node into a default
 * <:fill> node
 */
export default function slottifyChildNodes(node: ElementNode) {
	const nonFillNodes = node.children.filter((c) => !isFillNode(c));
	// TODO: Not if it's only spaces??
	if (nonFillNodes.length) {
		let defaultFillNode = node.children.find(
			(n) => isFillNode(n) && !n.attributes.find((a) => a.name === "name"),
		) as ElementNode | undefined;
		if (!defaultFillNode) {
			defaultFillNode = {
				type: "special",
				tagName: ":fill",
				attributes: [],
				children: nonFillNodes,
			};
			node.children.unshift(defaultFillNode);
		}
	}
	node.children = node.children.filter((c) => isFillNode(c));
}

function isFillNode(n: Node): n is ElementNode {
	return isSpecialNode(n) && n.tagName === ":fill";
}
