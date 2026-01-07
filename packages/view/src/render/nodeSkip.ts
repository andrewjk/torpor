import context from "./context";
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

	// NOTE: We know these are not null as it is being called from generated code
	if (context.hydrationNode !== null) {
		for (let i = 0; i < count; i++) {
			nextNode = nodeCheckHydrationBreak(nextNode.nextSibling)!;
		}
	} else {
		for (let i = 0; i < count; i++) {
			nextNode = nextNode.nextSibling!;
		}
	}

	return nextNode;
}
