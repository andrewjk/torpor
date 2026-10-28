import type Region from "../types/Region";
import clearRegion from "./clearRegion";
import context from "./context";

export default function runControlBranch(region: Region, oldIndex: number, index: number): boolean {
	// Clear the recreate flag if it was set — it only needs to trigger once
	const recreate = (region as any).recreate;
	if (recreate) {
		(region as any).recreate = false;
	}

	// Hydration branch mismatch. While hydrating, `runControl` stashes the
	// branch index the server rendered for this control (from the block's
	// `<!^2>` break marker) and the anchor that ends the block. When the
	// client picks a different branch here — server and client conditions can
	// legitimately differ (browser-only state, effects that no-op on the
	// server) — the server's branch must be recreated: its markup is cleared
	// and the client's branch renders fresh DOM, instead of the client
	// adopting markup from a branch it didn't pick.
	//
	// An empty server block (no branch matched on the server; the hydration
	// cursor is already on the anchor) recreates as well, so the client's
	// branch is inserted rather than hydrated against nothing.
	const anchor = (region as any).ssrBranchAnchor;
	if (anchor !== undefined) {
		(region as any).ssrBranchAnchor = undefined;
		const ssrBranchIndex = (region as any).ssrBranchIndex;
		(region as any).ssrBranchIndex = undefined;

		const hydrationNode = context.hydrationNode;
		if (
			hydrationNode !== null &&
			((ssrBranchIndex !== undefined && ssrBranchIndex !== index) ||
				(ssrBranchIndex === undefined && hydrationNode === anchor))
		) {
			(region as any).ssrBranchRecreated = true;
			clearServerBranch(region, hydrationNode, anchor);
		}
	}

	// Whether this region has rendered a branch before. A region's first
	// render has no previous branch of its own to clear — its `nextRegion`
	// link may point at an unrelated sibling region pushed after it in the
	// region chain, and clearing it would destroy live content mounted
	// elsewhere. (Callers like `runTry` still force clears on later runs by
	// passing a sentinel old index.)
	const firstRender = (region as any).hasRenderedBranch !== true;
	(region as any).hasRenderedBranch = true;

	if (oldIndex === index) {
		if (recreate) {
			if (region.nextRegion !== null && region.nextRegion.depth > region.depth) {
				clearRegion(region.nextRegion);
			}
			return true;
		}
		return false;
	}
	if (!firstRender && region.nextRegion !== null && region.nextRegion.depth > region.depth) {
		clearRegion(region.nextRegion);
	}

	return true;
}

/**
 * Clears a server-rendered control branch that the client didn't pick, so the
 * client's branch renders fresh DOM (hydration is disabled for the render,
 * which makes `addFragment` insert instead of adopt) and the parent resumes
 * hydrating at the control's anchor afterwards (see `runControl`).
 *
 * No client regions or effects exist for the server's markup — it was never
 * rendered through the client pipeline — so the nodes can simply be removed.
 * The nodes span from the first node inside the hydration block (the
 * hydration cursor) up to (not including) the control's anchor.
 *
 * Ancestor regions whose window starts at the removed node are reset to the
 * anchor: the same shape a mount-time block whose region owns only the anchor
 * has. `widenAncestorsAtAnchor` widens those to the fresh branch's first node
 * once the branch has rendered.
 */
function clearServerBranch(region: Region, removedFirst: ChildNode, anchor: Node): void {
	// Reset ancestor windows that start at the node being removed
	let ancestor: Region | null = region.previousRegion;
	let ancestorDepth = region.depth;
	while (ancestor !== null && ancestor.depth < ancestorDepth) {
		if (ancestor.startNode === removedFirst) {
			ancestor.startNode = anchor as ChildNode;
		}
		ancestorDepth = ancestor.depth;
		ancestor = ancestor.previousRegion;
	}

	// Remove the server's branch content
	context.hydrationNode = null;
	let node: ChildNode | null = removedFirst;
	while (node !== null && node !== anchor) {
		const next: ChildNode | null = node.nextSibling;
		node.remove();
		node = next;
	}
}
