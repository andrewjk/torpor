import context from "./context";
import { HYDRATION_END, HYDRATION_START } from "./hydrationMarkers";
import isCommentNode from "./isCommentNode";
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
 * @returns The anchor node.
 */
export default function nodeAnchor(node: ChildNode): ChildNode {
	if (context.hydrationNode !== null) {
		if (isCommentNode(node) && node.data === HYDRATION_START) {
			// Save the parent before removing the node, so we know when to
			// stop walking up the tree during document-order traversal
			const startParent = node.parentNode;

			// Skip and remove the start node, setting the hydration node in
			// nodeNext
			let currentNode = nodeNext(node);
			node.remove();

			// Go through nodes in document order until we get to the end.
			// We use document order (descending into child elements) rather
			// than just siblings, because the HTML parser may move hydration
			// markers into auto-inserted elements (e.g. <tbody> inside <table>)
			let level = 1;
			while (currentNode !== null) {
				if (isCommentNode(currentNode)) {
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
				// Document-order traversal: descend into children first,
				// then try siblings. When siblings are exhausted, walk up
				// to ancestors (but not past startParent) and try their siblings
				if (currentNode.firstChild) {
					currentNode = currentNode.firstChild;
				} else if (currentNode.nextSibling) {
					currentNode = currentNode.nextSibling;
				} else {
					// No children and no next sibling: walk up to find an
					// ancestor that has a next sibling
					let parent: Node | null = currentNode.parentNode;
					while (
						parent !== null &&
						parent.nextSibling === null &&
						parent !== startParent
					) {
						parent = parent.parentNode;
					}
					// Don't go past startParent
					if (parent === null || parent === startParent) {
						currentNode = null;
					} else {
						currentNode = parent.nextSibling;
					}
				}
			}

			if (currentNode === null) {
				throw new Error("End hydration comment not found");
			}
		}
	}

	return node;
}
