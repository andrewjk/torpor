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
	if (context.hydrationNode !== null) {
		// If the required node is a text node, and we already have one, just use
		// it. This is caused by text nodes being merged in HTML
		if (text && isTextNode(node)) {
			return node;
		}

		let next = nodeCheckHydrationBreak(node.nextSibling);

		// When seeking non-text nodes during hydration, skip past whitespace-only
		// text nodes and any trailing break markers, so callers land on the
		// expected element node rather than an intervening text node
		while (!text && next !== null && isTextNode(next) && next.textContent?.trim() === "") {
			next = nodeCheckHydrationBreak(next.nextSibling);
		}

		return next!;
	}

	// NOTE: We know this is not null as it is being called from generated code
	return node.nextSibling!;
}
