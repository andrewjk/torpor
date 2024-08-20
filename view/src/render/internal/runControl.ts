import context from "../../global/context";
import Range from "../../global/types/Range";
import $run from "../../watch/$run";
import popRange from "./popRange";
import pushRange from "./pushRange";
import pushRangeToParent from "./pushRangeToParent";

/**
 * Runs an`if`, `switch` or `await` control statement
 * @param create A function that creates the control statement's branches
 */
export default function runControl(
  range: Range,
  anchor: Node | null,
  create: (anchor: Node | null) => void,
) {
  // Store the index in the range so that it can be accessed by the statement's
  // branches
  range.index = -1;

  const oldRange = pushRangeToParent(range);

  // Run the control statement in an effect
  $run(function runControl() {
    // Push and pop the control statement on subsequent runs, so that new branch
    // ranges will be added to its children
    const oldBranchRange = pushRange(range);

    // Run the function that creates the control statement's branches
    create(anchor);

    popRange(oldBranchRange);
  });

  // If we're mounting, the anchor will be the one that is passed in, but if
  // we're hydrating it will be after the active branch's HTML elements, so we
  // need to update it after the branches have been hydrated
  if (context.hydrationNode) {
    anchor = context.hydrationNode.nextSibling;
  }

  popRange(oldRange);
}
