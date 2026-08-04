import context from "./context";
import { HYDRATION_BREAK, HYDRATION_START } from "./hydrationMarkers";
import isCommentNode from "./isCommentNode";
import isTextNode from "./isTextNode";

/**
 * Walks the hydration cursor past skippable leading nodes (whitespace text,
 * branch-break markers, auto-inserted `<tbody>`) and lands on the first real
 * content node — the same walk `nodeRoot` performs for the non-text case.
 *
 * Sets `region.startNode` to the landed node (unless it's a control-start
 * marker, which `nodeAnchor` consumes next). Returns the landed node and
 * advances `context.hydrationNode` to it.
 *
 * Extracted so `nodeRoot` and `nodeRootElement` share one implementation of
 * the cursor walk.
 */
export default function walkHydrationRoot(): ChildNode {
	let rootNode: ChildNode | null = context.hydrationNode;

	// For non-text fragments, skip leading branch-break markers (removing
	// them), empty anchor comments from preceding siblings, and whitespace
	// text nodes. Stop at a control-start marker (nodeAnchor walks it) or
	// real content.
	while (rootNode !== null && isSkippable(rootNode)) {
		const next: ChildNode | null = rootNode.nextSibling;
		if (isCommentNode(rootNode) && rootNode.data === HYDRATION_BREAK) {
			rootNode.remove();
		}
		rootNode = next;
		context.hydrationNode = rootNode;
	}

	// Descend through auto-inserted <tbody> elements. The HTML parser wraps
	// <tr> elements in <tbody>, which can leave the cursor on the <tbody>
	// rather than its first <tr> when entering a @for inside a table.
	while (
		rootNode !== null &&
		(rootNode as HTMLElement).nodeName === "TBODY" &&
		rootNode.firstChild !== null
	) {
		rootNode = rootNode.firstChild as ChildNode;
		context.hydrationNode = rootNode;
	}

	// If hydrating, set the active region's start node. Control-start markers
	// are left for nodeAnchor to walk — it sets the start node to the first
	// inner node.
	const region = context.activeRegion;
	const isControlStart =
		rootNode !== null && isCommentNode(rootNode) && rootNode.data === HYDRATION_START;
	if (region.startNode === null && !isControlStart) {
		region.startNode = rootNode;
	}

	return rootNode!;
}

function isSkippable(node: ChildNode): boolean {
	if (isTextNode(node) && (node.textContent ?? "").trim() === "") return true;
	if (isCommentNode(node)) {
		// Skip branch-break markers and empty anchor comments. Control-start
		// (`[`) and control-end (`]`) markers are NOT skipped.
		return node.data === HYDRATION_BREAK || node.data === "";
	}
	return false;
}
