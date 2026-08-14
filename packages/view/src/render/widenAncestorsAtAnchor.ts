import type Region from "../types/Region";

/**
 * Widens ancestor region node windows after a control re-run rendered
 * content at its anchor.
 *
 * A region that owns only a control's anchor comment captures
 * `startNode = endNode = anchor` when it mounts (e.g. a `@for` row whose
 * body is a single `@if`, or an outer `@if` whose body is a single control).
 * Content rendered by a LATER re-run of that control is inserted into the
 * live DOM just BEFORE the anchor — outside that window — so clearing the
 * owning region would remove only the anchor and orphan the branch content.
 * At mount time this can't happen (content is added to the region's detached
 * fragment first, so its `startNode` already covers it), which is why only
 * re-runs need this fix.
 *
 * The first node of the newly rendered content is the first DESCENDANT region
 * of the control that owns nodes (control regions themselves have null
 * `startNode`). Ancestors are the regions with strictly decreasing depth on
 * the `previousRegion` chain; only those whose window starts exactly at the
 * anchor are widened.
 */
export default function widenAncestorsAtAnchor(region: Region, anchor: Node | null): void {
	if (anchor === null) return;

	// Find the first node-bearing descendant of this control run
	let child: Region | null = region.nextRegion;
	while (child !== null && child.depth > region.depth && child.startNode === null) {
		child = child.nextRegion;
	}
	if (child === null || child.depth <= region.depth || child.startNode === anchor) {
		return;
	}
	const firstNode = child.startNode;

	// Widen every ancestor whose window starts at the anchor. Walk
	// `previousRegion` while depth strictly decreases, so sibling chains
	// (equal depth) terminate the walk — only true ancestors can own the
	// anchor as their window start.
	let ancestor: Region | null = region.previousRegion;
	let ancestorDepth = region.depth;
	while (ancestor !== null && ancestor.depth < ancestorDepth) {
		if (ancestor.startNode === anchor) {
			ancestor.startNode = firstNode;
		}
		ancestorDepth = ancestor.depth;
		ancestor = ancestor.previousRegion;
	}
}
