import context from "../../global/context";
import type Range from "../../global/types/Range";

export default function pushRangeToParent(range: Range): Range | null {
	// Add the new range to the currently active range's children, so that we
	// can delete the children with the parent
	const activeRange = context.activeRange;
	if (activeRange) {
		activeRange.children = activeRange.children || [];
		activeRange.children.push(range);
		range.parent = activeRange;
	}
	// Set the new active range
	context.activeRange = range;
	return activeRange;
}
