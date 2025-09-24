import type Range from "../types/Range";
import clearRange from "./clearRange";
import newRange from "./newRange";
import popRange from "./popRange";
import pushRange from "./pushRange";

export default function runControlBranch(range: Range, create: () => void): void {
	// Branching ranges have exactly one child -- remove it if necessary
	if (range.children === 1) {
		// HACK: This is bad -- it means that the parent range has been cleared,
		// but that should have cleared the effect that runs this child range??
		// TODO: Look into this further...
		if (range.nextRange === null) return;

		clearRange(range.nextRange!);
		range.children = 0;
	}

	const oldRange = pushRange(newRange(), true);

	// Run the create function
	create();

	popRange(oldRange);
}
