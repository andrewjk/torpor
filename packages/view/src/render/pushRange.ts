import { devContext } from "../dev";
import type Range from "../types/Range";
import context from "./context";

export default function pushRange(range: Range, toParent = false): Range {
	const activeRange = context.activeRange;

	// Add the new range to the currently active range's children, so that we
	// can delete the children with the parent
	if (toParent) {
		const previousRange = context.previousRange;
		range.previousRange = previousRange;

		const nextRange = previousRange.nextRange;
		previousRange.nextRange = range;
		range.nextRange = nextRange;

		range.depth = activeRange.depth + 1;
	}

	// Set the new active range
	context.activeRange = range;
	context.previousRange = range;

	// DEBUG:
	devContext.onRangePushed(range);

	// Return the old active range, so that it can be reset when done
	return activeRange;
}
