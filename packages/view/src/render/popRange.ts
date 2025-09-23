import type Range from "../types/Range";
import context from "./context";

export default function popRange(oldRange: Range): void {
	context.activeRange = oldRange;
}
