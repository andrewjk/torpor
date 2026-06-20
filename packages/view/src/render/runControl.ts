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
	}, name);

	// If we're mounting, the anchor will be the one that is passed in, but if
	// we're hydrating it will be after the active branch's HTML elements, so we
	// need to update it after the branches have been hydrated
	if (context.hydrationNode) {
		anchor = context.hydrationNode.nextSibling;
	}
}
