import context from "./context";
import isTextNode from "./isTextNode";
import nodeCheckHydrationBreak from "./nodeCheckHydrationBreak";

/**
 * Gets the next sibling of a node.
 *
 * When hydrating, sets the hydration node.
 *
 * @param node The node.
 * @param text Whether we require a text node.
 */
export default function nodeNext(node: ChildNode, text = false): ChildNode {
	// If the required node is a text node, and we already have one, just use
	// it. This is caused by text nodes being merged in HTML
	if (context.hydrationNode !== null && text && isTextNode(node)) {
		return node;
	}

	let nextNode = nodeCheckHydrationBreak(node.nextSibling);

	// NOTE: We know this is not null as it is being called from generated code
	return nextNode!;
}
