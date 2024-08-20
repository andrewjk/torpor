import printNode from "../../debug/printNode";
import context from "../../global/context";
import nodeNext from "./nodeNext";

export default function findAnchor(node: Node) {
  // NOTE: We're assuming no intervening nodes such as spaces
  if (context.hydrationNode && node.nodeType === 8 && (node as Comment).data === "[") {
    // Skip the start node
    nodeNext(node);

    // Go through siblings until we get to the end
    let level = 1;
    let currentNode: Node | null = node;
    while (currentNode) {
      if (currentNode.nodeType === 8) {
        if ((currentNode as Comment).data === "[") {
          level += 1;
        } else if ((currentNode as Comment).data === "]") {
          level -= 1;
        }
        if (level === 0) {
          // TODO: Remove the comment nodes
          return currentNode.nextSibling;
        }
      }
      currentNode = currentNode.nextSibling;
    }
  }
  return node;
}
