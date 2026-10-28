/**
 * During hydration, the server writes the index of the branch it rendered for
 * a control statement (`@if`/`@switch`) into the block's leading branch-break
 * marker (`<!^2>`). `nodeAnchor` reads that marker while consuming the block's
 * markers and stashes the index here, keyed by the anchor node it returns —
 * the same pattern as `firstInsideNode`, since the marker is gone by the time
 * the index is needed. `runControl` picks the index up from the anchor so
 * `runControlBranch` can compare it with the branch the client picks: server
 * and client conditions can legitimately differ (browser-only state, effects
 * that no-op on the server), and a branch the server rendered but the client
 * didn't pick must be recreated rather than adopted.
 */
const branchIndexes = new WeakMap<ChildNode, number>();

export function setBranchIndex(anchor: ChildNode, index: number): void {
	branchIndexes.set(anchor, index);
}

/**
 * Takes (and clears) the server-rendered branch index stashed for the given
 * anchor node, or `undefined` if the anchor wasn't hydrated through a
 * branch-indexed hydration block.
 */
export default function takeBranchIndex(anchor: Node): number | undefined {
	const index = branchIndexes.get(anchor as ChildNode);
	if (index !== undefined) {
		branchIndexes.delete(anchor as ChildNode);
	}
	return index;
}
