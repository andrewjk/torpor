import type Range from "../../global/types/Range";
import clearRange from "./clearRange";
import popRange from "./popRange";
import pushRangeToParent from "./pushRangeToParent";

export default function runBranch(range: Range, index: number, create: () => void) {
  // Only run the branch if it's not the current branch
  if (range.index === index) {
    return;
  }

  if (range.index !== -1) {
    // @ts-ignore Branching ranges can only have exactly one child
    clearRange(range.children[0]);
    // @ts-ignore
    range.children.length = 0;
  }

  // TODO: Should I cache the branch ranges?
  let oldRange = pushRangeToParent({
    startNode: null,
    endNode: null,
    parent: null,
    children: null,
    index: 0,
    objectEffects: null,
    emptyEffects: null,
  });

  // Run the create function
  create();

  popRange(oldRange);

  // Set the index on the branching range
  range.index = index;
}
