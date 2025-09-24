import type Range from "../types/Range";
import context from "./context";

export default function pushRange(range: Range, toParent = false): Range | null {
	const activeRange = context.activeRange;

	// Add the new range to the currently active range's children, so that we
	// can delete the children with the parent
	if (toParent && activeRange !== null) {
		const lastRange = activeRange.lastRange ?? activeRange;
		range.previousRange = lastRange;
		lastRange.nextRange = range;

		activeRange.lastRange = range;
		activeRange.children++;
	}

	// Set the new active range
	context.activeRange = range;

	// Return the old active range, so that it can be reset when done
	return activeRange;
}
