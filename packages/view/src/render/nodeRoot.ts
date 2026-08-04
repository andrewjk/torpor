import context from "./context";
import { HYDRATION_START } from "./hydrationMarkers";
import isCommentNode from "./isCommentNode";
import isTextNode from "./isTextNode";
import walkHydrationRoot from "./walkHydrationRoot";

/**
 * Gets the first child in a fragment.
 *
 * When hydrating, also sets the active region's start node, while we have it.
 *
 * If the hydration cursor is on a control-start marker (`<![>`), the node is
 * left in place for `nodeAnchor` (called next as `t_anchor(t_root(...))`) to
 * walk — it consumes the matched `<![>...<!]>` pair, removes the markers and
 * sets the region's start node to the first node inside the block.
 *
 * For non-text fragments, leading branch-break markers (`<!^>`), empty anchor
 * comments left by preceding siblings, and residual whitespace-only text nodes
 * are skipped (break markers removed) so the region's start node lands on real
 * content. This replaces the per-sibling `t_next` calls that the codegen used
 * to emit when leading whitespace separated siblings; with whitespace trimmed
 * those calls are gone, so the advancement happens here.
 *
 * @param parent The parent of the fragment.
 * @param text Whether we require a text node.
 */
export default function nodeRoot(parent: Node, text = false): ChildNode {
	if (context.hydrationNode !== null) {
		let rootNode: ChildNode | null = context.hydrationNode;

		// If the root node we need is a text node, and the hydration node is
		// not a text node but the previous node is, use the previous node. This
		// is caused by text nodes being merged in HTML
		if (
			text &&
			!isTextNode(rootNode) &&
			rootNode.previousSibling !== null &&
			isTextNode(rootNode.previousSibling)
		) {
			rootNode = rootNode.previousSibling;
			context.hydrationNode = rootNode;
		}

		// For non-text fragments, walk past skippable leading nodes and set
		// the region's start node. Text fragments opt out because their
		// leading text node is the value the caller expects.
		if (!text) {
			return walkHydrationRoot();
		}

		const region = context.activeRegion;
		const isControlStart =
			rootNode !== null && isCommentNode(rootNode) && rootNode.data === HYDRATION_START;
		if (region.startNode === null && !isControlStart) {
			region.startNode = rootNode;
		}

		return rootNode!;
	} else {
		// NOTE: We know this is not null as it is being called from generated
		// code
		return parent.firstChild!;
	}
}
