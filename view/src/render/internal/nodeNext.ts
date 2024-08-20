import context from "../../global/context";
import { HYDRATION_BRANCH } from "./_global";
import isComment from "./isComment";

// TODO: Should have t_next(node, 3) to get the sibling 3 nodes along

/**
 * Gets the next sibling of a node
 */
export default function nodeNext(node: ChildNode) {
  let next = node.nextSibling;

  if (context.hydrationNode) {
    // Remove hydration comments that are inserted at the start of branches
    // They are just used to split up text nodes that would otherwise be joined in HTML
    if (next && isComment(next) && next.data === HYDRATION_BRANCH) {
      let comment = next;
      next = next.nextSibling;
      comment.remove();
    }
    context.hydrationNode = next;
  }

  return next;
}
