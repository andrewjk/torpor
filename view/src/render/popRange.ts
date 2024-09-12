import type Range from "../types/Range";
import context from "./context";

export default function popRange(oldRange: Range | null) {
	context.activeRange = oldRange;
}
