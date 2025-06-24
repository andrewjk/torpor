import context from "./context";
import { HYDRATION_BREAK } from "./hydrationMarkers";
import isComment from "./isComment";

// TODO: It would be good to remove this, if possible

/**
 * When hydrating, removes and skips hydration comments that are inserted at the
 * start of branches and used to split up text nodes that would otherwise be
 * joined in HTML.
 *
 * @param node The node to check and maybe skip.
 * @returns The next node.
 */
export default function nodeCheckHydrationBreak(node: ChildNode | null): ChildNode | null {
	if (context.hydrationNode) {
		if (node && isComment(node) && node.data === HYDRATION_BREAK) {
			let comment = node;
			node = node.nextSibling;
			comment.remove();
		}
		context.hydrationNode = node;
	}
	return node;
}
