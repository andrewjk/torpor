import { type Range } from "../types/Range";
import clearRange from "./clearRange";

export default function clearLayoutSlot(range: Range): void {
	clearRange(range);
}
