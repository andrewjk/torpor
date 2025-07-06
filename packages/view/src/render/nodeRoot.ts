import context from "./context";
import { HYDRATION_START } from "./hydrationMarkers";
import isCommentNode from "./isCommentNode";
import isTextNode from "./isTextNode";

/**
 * Gets the first child in a fragment.
 *
 * When hydrating, also sets the active range's start node, while we have it.
 *
 * @param parent The parent of the fragment.
 * @param text Whether we require a text node.
 */
export default function nodeRoot(parent: Node, text = false): ChildNode {
	if (context.hydrationNode) {
		let rootNode = context.hydrationNode;

		// If the root node we need is a text node, and the hydration node is
		// not a text node but the previous node is, use the previous node. This
		// is caused by text nodes being merged in HTML
		if (text && !isTextNode(rootNode) && isTextNode(rootNode.previousSibling)) {
			rootNode = rootNode.previousSibling;
			context.hydrationNode = rootNode;
		}

		// HACK: If the root node is a hydration start comment node, get the
		// next one instead
		if (isCommentNode(rootNode) && rootNode.data === HYDRATION_START) {
			rootNode = rootNode.nextSibling!;
			context.hydrationNode = rootNode;
		}

		// If hydrating, set the active range's start node
		const range = context.activeRange;
		if (range && !range.startNode) {
			range.startNode = rootNode;
		}

		return rootNode;
	} else {
		// NOTE: We know this is not null as it is being called from generated
		// code
		return parent.firstChild!;
	}
}
