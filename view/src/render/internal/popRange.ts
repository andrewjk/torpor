import context from "../../global/context";
import type Range from "../../global/types/Range";

export default function popRange(oldRange: Range | null) {
	context.activeRange = oldRange;
}
