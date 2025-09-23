import type Range from "../types/Range";
import context from "./context";

export default function pushRange(range: Range, toParent = false): Range | null {
	const activeRange = context.activeRange;

	// Add the new range to the currently active range's children, so that we
	// can delete the children with the parent
	if (toParent && activeRange !== null) {
		range.previousRange = context.previousRange;
		if (context.previousRange) {
			let nr = context.previousRange.nextRange;
			context.previousRange.nextRange = range;
			range.nextRange = nr;
		}

		activeRange.children++;
	}

	// Set the new active range
	context.activeRange = range;
	context.previousRange = range;

	// Return the old active range, so that it can be reset when done
	return activeRange;
}
