import context from "./context";
import { HYDRATION_BRANCH } from "./hydrationMarkers";
import isComment from "./isComment";

// TODO: Should have t_next(node, 3) to get the sibling 3 nodes along

/**
 * Gets the next sibling of a node
 */
export default function nodeNext(node: Node): Node {
	let nextNode = node.nextSibling;

	if (context.hydrationNode) {
		// Remove hydration comments that are inserted at the start of branches
		// They are just used to split up text nodes that would otherwise be joined in HTML
		if (nextNode && isComment(nextNode) && nextNode.data === HYDRATION_BRANCH) {
			let comment = nextNode;
			nextNode = nextNode.nextSibling;
			comment.remove();
		}
		context.hydrationNode = nextNode;
	}

	// NOTE: We know this is not null as it is being called from generated code
	return nextNode!;
}
