import context from "../../global/context";

/**
 * Gets the first child of a node
 */
export default function nodeChild(parent: ParentNode) {
  const child = parent.firstChild;
  if (context.hydrationNode) {
    context.hydrationNode = child;
  }
  return child;
}
