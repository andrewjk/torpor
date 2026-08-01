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
	const gen = (region as any).generation = ((region as any).generation ?? 0) + 1;

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
