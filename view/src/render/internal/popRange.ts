import type Range from "../../global/Range";
import context from "../../global/context";

export default function popRange(oldRange: Range | null) {
  context.activeRange = oldRange;
}
