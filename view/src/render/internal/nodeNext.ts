import context from "../../global/context";

// TODO: Should have t_next(node, 3) to get the sibling 3 nodes along

/**
 * Gets the next sibling of a node
 */
export default function nodeNext(node: Node) {
  let next = node.nextSibling;

  if (context.hydrationNode) {
    if (next && next.nodeType === 8 && (next as Comment).data === "^") {
      //console.log("skip hydration comment");
      next = next.nextSibling;
    }
    context.hydrationNode = next;
  }

  return next;
}
