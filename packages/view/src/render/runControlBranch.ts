import { type Range } from "../types/Range";
import clearRange from "./clearRange";
import newRange from "./newRange";
import popRange from "./popRange";
import pushRange from "./pushRange";

export default function runControlBranch(range: Range, index: number, create: () => void): void {
	// Only run the branch if it's not the current branch
	if (index >= 0 && range.index === index) {
		return;
	}

	if (range.children?.length) {
		// Branching ranges have exactly one child
		clearRange(range.children[0]);
		range.children.length = 0;
	}

	const oldRange = pushRange(newRange(), true);

	// Run the create function
	create();

	popRange(oldRange);

	// Set the index on the branching range
	range.index = index;
}
