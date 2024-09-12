import type Range from "../types/Range";
import context from "./context";

export default function pushRange(range: Range): Range | null {
	// Set the new active range
	const activeRange = context.activeRange;
	context.activeRange = range;
	return activeRange;
}
