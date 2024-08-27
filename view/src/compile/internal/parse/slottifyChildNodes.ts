import type ElementNode from "../../types/nodes/ElementNode";
import type Node from "../../types/nodes/Node";
import isSpecialNode from "../../types/nodes/isSpecialNode";

export default function slottifyChildNodes(node: ElementNode) {
	// Move any child nodes that aren't already in a <:fill> node into a default <:fill> node
	const isFillNode = (n: Node): n is ElementNode => isSpecialNode(n) && n.tagName === ":fill";
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
