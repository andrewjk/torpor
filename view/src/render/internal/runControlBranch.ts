import type Range from "../../global/types/Range";
import clearRange from "./clearRange";
import popRange from "./popRange";
import pushRangeToParent from "./pushRangeToParent";

export default function runControlBranch(range: Range, index: number, create: () => void) {
	// Only run the branch if it's not the current branch
	if (range.index === index) {
		return;
	}

	if (range.children?.length) {
		// Branching ranges have exactly one child
		clearRange(range.children[0]);
		range.children.length = 0;
	}

	const oldRange = pushRangeToParent({
		startNode: null,
		endNode: null,
		parent: null,
		children: null,
		index: 0,
		effects: null,
	});

	// Run the create function
	create();

	popRange(oldRange);

	// Set the index on the branching range
	range.index = index;
}
