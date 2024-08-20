import context from "../../global/context";
import nodeNext from "./nodeNext";

/**
 * Sets the hydration node after setting node attributes, just in case we went too far
 */
export default function nodeGoto(node: Node) {
  if (context.hydrationNode) {
    nodeNext(node);
  }
}
