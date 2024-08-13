import ElementNode from "./ElementNode";
import Node from "./Node";

export default function isElementNode(node: Node): node is ElementNode {
  return node.type === "element";
}
