import type Range from "../types/Range";
import clearRange from "./clearRange";
import context from "./context";
import newRange from "./newRange";
import popRange from "./popRange";
import pushRange from "./pushRange";

export default function runControlBranch(range: Range, create: () => void): void {
	// Branching ranges have exactly one child -- remove it if necessary
	if (range.children === 1) {
		clearRange(range.nextRange!);
		range.children = 0;
	}

	const oldRange = pushRange(newRange(), true);

	// Do NOT re-run the entire control for properties accessed while updating
	// its branches. E.g. we want to re-run the control for `@if ($state.x > 5)`
	// (in runControl) but not for `<span>{$state.text}</span>` (in
	// runControlBranch)
	const oldTarget = context.activeTarget;
	context.activeTarget = null;

	// Run the create function
	create();

	// Set the active effect back for the next branch
	context.activeTarget = oldTarget;

	popRange(oldRange);
}
