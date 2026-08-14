import type Region from "../types/Region";
import $run from "../watch/$run";
import context from "./context";
import popRegion from "./popRegion";
import pushRegion from "./pushRegion";

/**
 * Runs an `if`, `switch` or `await` control statement
 * @param create A function that creates the control statement's branches
 */
export default function runControl(
	region: Region,
	anchor: Node | null,
	create: (anchor: Node | null) => void,
	name?: string,
): void {
	let first = true;

	// Use a generation counter so stale effects (created by previous
	// runControl calls for the same region) can detect they're no longer
	// current and skip execution. The generation is incremented each time
	// runControl is called with this region.
	const gen = ((region as any).generation = ((region as any).generation ?? 0) + 1);

	// Run the control statement in an effect
	$run(function runControl() {
		// If this effect was created by a previous runControl call for the
		// same region, it is stale and should not execute
		if ((region as any).generation !== gen) {
			return;
		}

		if (region.depth === -2) {
			(region as any).recreate = true;
		}

		const oldRegion = pushRegion(region, first);
		first = false;

		// Run the function that creates the control statement's branches
		create(anchor);

		popRegion(oldRegion);

		// Widen ancestor regions whose node window starts at our anchor.
		//
		// A region that owns only a control's anchor comment captures
		// `startNode = endNode = anchor` when it mounts (e.g. a `@for` row
		// whose body is a single `@if`). Content rendered by a LATER re-run
		// of this control is inserted into the live DOM just BEFORE the
		// anchor — outside that window — so clearing the owning region would
		// remove only the anchor and orphan the branch content. At mount
		// time this can't happen (content is added to the region's detached
		// fragment first, so its `startNode` already covers it), which is
		// why only re-runs need this fix.
		//
		// The first node of the newly rendered content is the first child
		// region of this control that owns nodes. Ancestors are the regions
		// with strictly decreasing depth on the `previousRegion` chain.
		if (anchor !== null) {
			let child = region.nextRegion;
			while (child !== null && child.depth > region.depth && child.startNode === null) {
				child = child.nextRegion;
			}
			if (child !== null && child.depth > region.depth && child.startNode !== anchor) {
				const firstNode = child.startNode;
				let ancestor = region.previousRegion;
				let ancestorDepth = region.depth;
				while (ancestor !== null && ancestor.depth < ancestorDepth) {
					if (ancestor.startNode === anchor) {
						ancestor.startNode = firstNode;
					}
					ancestorDepth = ancestor.depth;
					ancestor = ancestor.previousRegion;
				}
			}
		}

		// While hydrating, reset the cursor to the control's anchor after its
		// content has been hydrated. The branches leave the cursor deep inside
		// (at the last nested node), but the parent fragment needs a stable
		// end node — the anchor persists until the parent clears it, so it is
		// safe to capture.
		if (context.hydrationNode !== null && anchor !== null) {
			context.hydrationNode = anchor as ChildNode;
		}
	}, name);
}
