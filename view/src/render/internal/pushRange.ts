import context from "../../global/context";
import type Range from "../../global/types/Range";

export default function pushRange(range: Range): Range | null {
	// Set the new active range
	const activeRange = context.activeRange;
	context.activeRange = range;
	return activeRange;
}
