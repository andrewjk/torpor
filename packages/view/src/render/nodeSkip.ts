import nodeCheckHydrationBreak from "./nodeCheckHydrationBreak";

/**
 * Gets the sibling of a node, x nodes after it.
 *
 * When hydrating, sets the hydration node.
 *
 * @param node The node.
 * @param count The number of nodes to skip.
 */
export default function nodeSkip(node: ChildNode, count: number): ChildNode {
	let nextNode = node;

	for (let i = 0; i < count; i++) {
		nextNode = nodeCheckHydrationBreak(nextNode.nextSibling)!;
	}

	// NOTE: We know this is not null as it is being called from generated code
	return nextNode!;
}
