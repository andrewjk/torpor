import Range from "../../global/Range";
import $run from "../../watch/$run";
import popRange from "./popRange";
import pushRange from "./pushRange";
import pushRangeToParent from "./pushRangeToParent";

/**
 * Runs a control statement, such as an if, switch, or await
 * @param create A function that creates the control statement's branches
 */
export default function runControl(range: Range, create: () => void) {
  // Store the index in the range so that it can be accessed by the statement's branches
  range.index = -1;
  let oldRange = pushRangeToParent(range);

  // Run the control statement in an effect
  $run(() => {
    // Push and pop the control statement on subsequent runs, so that new branch ranges will be
    // added to its children
    let oldBranchRange = pushRange(range);

    // Run the function that creates the control statement's branches
    create();

    popRange(oldBranchRange);
  });

  popRange(oldRange);
}
