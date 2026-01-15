import type ElementNode from "../types/nodes/ElementNode";
import type TemplateNode from "../types/nodes/TemplateNode";
import isSpaceNode from "../utils/isSpaceNode";
import isSpecialNode from "../utils/isSpecialNode";

/**
 * Moves any child nodes that aren't already in a <fill> node into a default
 * <fill> node
 */
export default function slottifyChildNodes(node: ElementNode, source: string): void {
	// Gather nodes that are not in <fill> nodes, and not the spaces surrounding fill nodes
	let nonFillNodes: TemplateNode[] = [];
	for (let child of node.children) {
		if (isFillNode(child)) {
			if (nonFillNodes.find((n) => !isSpaceNode(n)) === undefined) {
				nonFillNodes = [];
			} else {
				break;
			}
		} else {
			nonFillNodes.push(child);
		}
	}
	if (nonFillNodes.find((n) => !isSpaceNode(n)) === undefined) {
		nonFillNodes = [];
	}

	// If we found any non-fill node nodes, move them into a default fill node
	if (nonFillNodes.length) {
		let defaultFillNode = node.children.find(
			(n) => isFillNode(n) && !n.attributes.find((a) => a.name === "name"),
		) as ElementNode | undefined;
		if (!defaultFillNode) {
			defaultFillNode = {
				type: "special",
				tagName: "filldef",
				attributes: [],
				children: nonFillNodes,
				span: { start: 0, end: 0 },
				// HACK: We're checking all children, potentially including the
				// fill nodes we filtered out, and child components which
				// shouldn't affect the parent component
				hasSlotProps: /\$slot\b/.test(source),
			};
			node.children.unshift(defaultFillNode);
		}
		node.children = node.children.filter((c) => isFillNode(c) || !nonFillNodes.includes(c));
	}
}

function isFillNode(n: TemplateNode): n is ElementNode {
	return isSpecialNode(n) && (n.tagName === "fill" || n.tagName === "filldef");
}
