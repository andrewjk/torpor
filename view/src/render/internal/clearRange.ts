import type Range from "../../global/Range";
import removeRangeEffects from "../../watch/internal/removeRangeEffects";

export default function clearRange(range: Range) {
  const docRange = document.createRange();
  if (range.startNode) {
    let endNode = range.endNode || range.startNode;
    docRange.setStartBefore(range.startNode);
    docRange.setEndAfter(endNode);
    docRange.deleteContents();
    range.startNode = null;
    range.endNode = null;
  }

  // TODO: Put this somewhere better?
  removeRangeEffects(range);
}
