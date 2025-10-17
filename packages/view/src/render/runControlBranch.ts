import type Range from "../types/Range";
import clearRange from "./clearRange";
import newRange from "./newRange";
import popRange from "./popRange";
import pushRange from "./pushRange";

export default function runControlBranch(range: Range, create: () => void, name?: string): void {
	// HACK: This is bad -- it means that the parent range has been cleared,
	// but that should have cleared the effect that runs this child range??
	// TODO: Look into this further...
	if (range.depth === -2) return;

	// Branching ranges have exactly one child -- remove it if necessary
	if (range.nextRange !== null && range.nextRange.depth > range.depth) {
		clearRange(range.nextRange!);
	}

	const branchRange = newRange(name);
	const oldRange = pushRange(branchRange, true);

	// Run the create function
	create();

	popRange(oldRange);
}
