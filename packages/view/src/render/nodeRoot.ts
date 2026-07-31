import context from "./context";
import { HYDRATION_BREAK, HYDRATION_START } from "./hydrationMarkers";
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
	if (context.hydrationNode !== null) {
		let rootNode: ChildNode | null = context.hydrationNode;

		if (text) {
			// If the root node we need is a text node, and the hydration node is
			// not a text node but the previous node is, use the previous node.
			// This is caused by text nodes being merged in HTML
			if (
				!isTextNode(rootNode) &&
				rootNode.previousSibling !== null &&
				isTextNode(rootNode.previousSibling)
			) {
				rootNode = rootNode.previousSibling;
				context.hydrationNode = rootNode;
			}

			// HACK: If the root node is a hydration start comment node, get the
			// next one instead
			if (isCommentNode(rootNode) && rootNode.data === HYDRATION_START) {
				rootNode = rootNode.nextSibling;
				context.hydrationNode = rootNode;
			}
		} else {
			// HACK: If the root node is a hydration start comment node, get the
			// next one instead
			if (isCommentNode(rootNode) && rootNode.data === HYDRATION_START) {
				rootNode = rootNode.nextSibling;
				context.hydrationNode = rootNode;
			}

			// Skip branch-break markers (removing them, since they exist only to
			// separate text nodes during hydration) and whitespace-only text
			// nodes, advancing the cursor so the returned node — which doubles
			// as the fragment's end node — and the region's start node both land
			// on real content. This keeps region boundaries stable even when
			// template whitespace has been trimmed.
			while (rootNode !== null && isSkippableRoot(rootNode)) {
				const next = rootNode.nextSibling;
				if (isCommentNode(rootNode) && rootNode.data === HYDRATION_BREAK) {
					rootNode.remove();
				}
				rootNode = next;
			}
			context.hydrationNode = rootNode;
		}

		// If hydrating, set the active region's start node
		const region = context.activeRegion;
		if (region.startNode === null) {
			region.startNode = rootNode;
		}

		return rootNode!;
	} else {
		// NOTE: We know this is not null as it is being called from generated
		// code
		return parent.firstChild!;
	}
}

function isSkippableRoot(node: ChildNode): boolean {
	if (isTextNode(node) && (node.textContent ?? "").trim() === "") return true;
	if (isCommentNode(node)) {
		const data = node.data;
		// Skip branch-break markers, block-start markers and empty `<!>`
		// anchor comments so the boundary lands on real content. End `]`
		// markers are NOT skipped — they mark the close of a block and skipping
		// them can run past the end of an empty block (landing on null).
		return data === HYDRATION_BREAK || data === HYDRATION_START || data === "";
	}
	return false;
}
