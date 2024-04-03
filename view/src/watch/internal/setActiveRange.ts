/*
import type Range from "../../global/Range";
import context from "../../global/context";

export default function setActiveRange(range: Range) {
  // Add the new range to the currently active range's children, so that we
  // can delete the children with the parent
  const parentRange = context.rangeStack[context.rangeStack.length - 1];
  if (parentRange) {
    parentRange.children = parentRange.children || [];
    parentRange.children.push(range);
    range.parent = parentRange;
  }

  // Set the new active range
  context.rangeStack = range;
}
*/
