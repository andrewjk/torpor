import Range from "../../global/Range";
import clearRange from "./clearRange";
import popRange from "./popRange";
import pushRange from "./pushRange";

export default function runBranch(range: Range, index: number, create: () => void) {
  // Only run the branch if it's not the current branch
  if (range.index === index) {
    return;
  }

  if (range.index !== -1) {
    // @ts-ignore Branching ranges can only have one child
    clearRange(range.children[0]);
  }

  // TODO: Should I cache the branch ranges?
  pushRange({
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

  popRange();

  // Set the index on the branching range
  range.index = index;
}
