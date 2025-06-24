import context from "./context";
import { HYDRATION_END, HYDRATION_START } from "./hydrationMarkers";
import isComment from "./isComment";
import nodeNext from "./nodeNext";

/**
 * Gets the anchor node for a control statement or component.
 *
 * When mounting, this just returns the anchor node parameter (because it was
 * created).
 *
 * When hydrating, there should be matched <![> and <!]> comments in the HTML,
 * and the anchor node should be after the end comment. The matched comment
 * nodes will be deleted, and the hydration node set to the first node inside
 * the matched comments.
 *
 * @param node The potential anchor node.
 * @param subsequent Whether this is the second time the anchor is being retrieved.
 * @returns The anchor node.
 */
export default function nodeAnchor(node: ChildNode, subsequent = false): ChildNode {
	if (context.hydrationNode) {
		// The first time we get a node anchor during hydration, the hydration
		// node gets set to the first node in the statement, and then we work
		// through the nodes until we get to the anchor node itself. So, the
		// second time we get the anchor node, the hydration node should have
		// been set to it. I'm not sure this is going to always be the case...
		if (subsequent) {
			return context.hydrationNode;
		}

		if (isComment(node) && node.data === HYDRATION_START) {
			// Skip and remove the start node, setting the hydration node in
			// nodeNext
			let currentNode = nodeNext(node);
			node.remove();

			// Go through siblings until we get to the end
			let level = 1;
			while (currentNode) {
				if (isComment(currentNode)) {
					if (currentNode.data === HYDRATION_START) {
						level += 1;
					} else if (currentNode.data === HYDRATION_END) {
						level -= 1;
						if (level === 0) {
							// Remove the end node and return the next one
							const endNode = currentNode.nextSibling;
							currentNode.remove();

							// If the statement is empty (i.e. the end comment
							// immediately follows the start comment), move the
							// hydration node past the removed end comment to
							// the anchor, so that we can continue to the next
							// nodes
							if (context.hydrationNode === currentNode) {
								context.hydrationNode = endNode;
							}

							// NOTE: We know this is not null as it is being
							// called from generated code
							return endNode!;
						}
					}
				}
				currentNode = currentNode.nextSibling!;
			}

			if (!currentNode) {
				throw new Error("End hydration comment not found");
			}
		}
	}

	return node;
}
