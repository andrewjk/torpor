import ElementNode from "./ElementNode";
import Node from "./Node";

export default function isSpecialNode(node: Node): node is ElementNode {
  return node.type === "special";
}
