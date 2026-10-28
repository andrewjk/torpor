import { setBranchIndex } from "./branchIndex";
import context from "./context";
import { setFirstInsideNode } from "./firstInsideNode";
import {
	HYDRATION_END,
	HYDRATION_START,
	hydrationBreakIndex,
	isHydrationBreak,
} from "./hydrationMarkers";
import isCommentNode from "./isCommentNode";
import isTextNode from "./isTextNode";
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

			// The server writes the branch it rendered into the leading
			// branch-break marker (`<!^2>`). `nodeNext` below strips that
			// marker without looking at it, so read the index off it here
			// first. It gets stashed on the anchor at the end, so `runControl`
			// can recreate the block when the client picks a different branch
			// than the server rendered.
			let branchIndex: number | undefined = undefined;
			let peek: ChildNode | null = node.nextSibling;
			while (peek !== null && isTextNode(peek) && (peek.textContent ?? "").trim() === "") {
				peek = peek.nextSibling;
			}
			if (peek !== null && isCommentNode(peek) && isHydrationBreak(peek.data)) {
				branchIndex = hydrationBreakIndex(peek.data);
			}

			// Skip and remove the start node, setting the hydration node in
			// nodeNext. The node returned here is the first node inside the
			// block (after any leading branch-break marker), which becomes the
			// active region's start node.
			let currentNode: ChildNode | null = nodeNext(node);
			node.remove();

			// An empty control block can emit one branch-break marker per
			// non-taken branch (e.g. an `@if`/`else if` where no branch
			// matched), and `nodeNext` only strips the first. Skip any that
			// remain: they are server-only artifacts, not content, and must not
			// become the region's start node.
			while (
				currentNode !== null &&
				isCommentNode(currentNode) &&
				isHydrationBreak(currentNode.data)
			) {
				if (branchIndex === undefined) {
					branchIndex = hydrationBreakIndex(currentNode.data);
				}
				const next: ChildNode | null = currentNode.nextSibling;
				currentNode.remove();
				currentNode = next;
				context.hydrationNode = currentNode;
			}

			const firstInside: ChildNode | null = currentNode;

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

							// If the first node inside the block is the end
							// marker itself, the block has no content (only
							// markers). `firstInside` would then point at a node
							// that's about to be removed, leaving the region's
							// start node detached and its clear walk running past
							// into preceding siblings.
							const firstContent = firstInside === currentNode ? null : firstInside;

							// Set the active region's start node to the first
							// node inside the block. This mirrors mounting,
							// where the start node is the fragment's first
							// child — the actual content — rather than a marker.
							// For an empty block, mounting captures the anchor
							// comment as both bounds, so match that.
							const region = context.activeRegion;
							if (region.startNode === null) {
								region.startNode = firstContent ?? endNode;
							}

							// Stash the first node inside the block, keyed by
							// the anchor being returned. Generated code (e.g.
							// for `@html`) reads it back to adopt the
							// server-rendered nodes, since the markers that
							// bounded them have now been removed.
							setFirstInsideNode(endNode!, firstContent);

							// Stash the server-rendered branch index alongside
							// it, for the same reason (see branchIndex.ts)
							if (branchIndex !== undefined) {
								setBranchIndex(endNode!, branchIndex);
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
					while (parent !== null && parent.nextSibling === null && parent !== startParent) {
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
