import type Range from "../types/Range";
import clearRange from "./clearRange";
import context from "./context";

export default function clearLayoutSlot(range: Range): void {
	context.previousRange = range.previousRange!;
	clearRange(range);
}
