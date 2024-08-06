import Range from "../../global/Range";
import context from "../../global/context";

export default function pushRange(range: Range): Range | null {
  // Set the new active range
  const activeRange = context.activeRange;
  context.activeRange = range;
  return activeRange;
}
