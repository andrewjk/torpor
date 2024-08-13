import ControlNode from "./ControlNode";
import Node from "./Node";

export default function isControlNode(node: Node): node is ControlNode {
  return node.type === "control";
}
