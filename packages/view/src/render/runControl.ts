import { type Range } from "../types/Range";
import $run from "./$run";
import context from "./context";
import popRange from "./popRange";
import pushRange from "./pushRange";

/**
 * Runs an`if`, `switch` or `await` control statement
 * @param create A function that creates the control statement's branches
 */
export default function runControl(
	range: Range,
	anchor: Node | null,
	create: (anchor: Node | null) => void,
): void {
	// Store the index in the range so that it can be accessed by the statement's
	// branches
	range.index = -1;

	const oldRange = pushRange(range, true);

	// Run the control statement in an effect
	$run(function runControl() {
		// Push and pop the control statement on subsequent runs, so that new branch
		// ranges will be added to its children
		const oldBranchRange = pushRange(range);

		// Run the function that creates the control statement's branches
		create(anchor);

		popRange(oldBranchRange);
	});

	// If we're mounting, the anchor will be the one that is passed in, but if
	// we're hydrating it will be after the active branch's HTML elements, so we
	// need to update it after the branches have been hydrated
	if (context.hydrationNode) {
		anchor = context.hydrationNode.nextSibling;
	}

	popRange(oldRange);
}
