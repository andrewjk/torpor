import context from "./context";
import { HYDRATION_BRANCH } from "./hydrationMarkers";
import isComment from "./isComment";

/**
 * Gets the next sibling of a node
 */
export default function nodeNext(node: Node, count?: number): Node {
	let nextNode = checkHydrationNode(node.nextSibling);

	if (count) {
		for (let i = 1; i < count; i++) {
			nextNode = checkHydrationNode(nextNode!.nextSibling);
		}
	}

	// NOTE: We know nextNode is not null as it is being called from generated code
	return nextNode!;
}

function checkHydrationNode(nextNode: ChildNode | null) {
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
	return nextNode;
}
