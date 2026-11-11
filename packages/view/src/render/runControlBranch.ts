import devContext from "../dev/devContext";
import type Region from "../types/Region";
import clearRegion from "./clearRegion";
import context from "./context";
import newRegion from "./newRegion";
import pushRegion from "./pushRegion";

/**
 * Runs one branch of a control block (`@if`/`@switch`/`@replace`, and the
 * runtime-driven `@await`/`@try` groups). Returns the region to pop after
 * the branch's content has rendered, or `null` when the branch should be
 * skipped (same index as the previous render and not forced to recreate).
 *
 * The branch region is created and pushed here — the single point of branch
 * bookkeeping, so emitters (and the runtime-driven groups) don't repeat the
 * region/push/pop dance and can't get it wrong (e.g. forgetting that the
 * clear above can release the region `context.previousRegion` points at).
 *
 * @param region The control's own region
 * @param oldIndex The branch index of the previous render (callers pass a
 *   sentinel like `0` → `-1` to force a clear-and-rerender)
 * @param index The branch index of this render
 * @param name Dev-only name for the pushed branch region
 */
export default function runControlBranch(
	region: Region,
	oldIndex: number,
	index: number,
	name?: string,
): Region | null {
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
			return pushBranchRegion(region, name);
		}
		return null;
	}
	if (!firstRender && region.nextRegion !== null && region.nextRegion.depth > region.depth) {
		clearRegion(region.nextRegion);
	}

	return pushBranchRegion(region, name);
}

/**
 * Creates and pushes the region the branch's content renders into.
 *
 * The clear above can release the region `context.previousRegion` points at
 * (the previous branch subtree's last region), so re-anchor it to the control
 * region before linking — otherwise the fresh branch would chain off a
 * released region instead of the control's.
 */
function pushBranchRegion(region: Region, name?: string): Region {
	context.previousRegion = region;
	return pushRegion(newRegion(devContext.enabled ? name : undefined), true);
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
