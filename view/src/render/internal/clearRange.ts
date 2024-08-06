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

  // Clear any effects that take place within this range and its children
  removeRangeEffects(range);

  // Delete this range from its parent's children collection
  // NOTE: Maybe range.parent should be required
  // NOTE: Maybe parent.children should be a Set
  if (range.parent && range.parent.children) {
    let index = range.parent.children.indexOf(range);
    if (index === -1) {
      throw new Error("Range not found among parent's children");
    }
    range.parent.children.splice(index, 1);
  }
}
