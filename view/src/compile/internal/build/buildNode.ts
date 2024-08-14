import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type Node from "../../types/nodes/Node";
import type TextNode from "../../types/nodes/TextNode";
import type BuildStatus from "./BuildStatus";
import Builder from "./Builder";
import buildComponentNode from "./buildComponentNode";
import buildControlNode from "./buildControlNode";
import buildElementNode from "./buildElementNode";
import buildSpecialNode from "./buildSpecialNode";
import buildTextNode from "./buildTextNode";

export default function buildNode(
  node: Node,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
  root = false,
) {
  switch (node.type) {
    case "control": {
      buildControlNode(node as ControlNode, status, b, parentName, anchorName);
      break;
    }
    case "component": {
      buildComponentNode(node as ElementNode, status, b, parentName, anchorName, root);
      break;
    }
    case "element": {
      buildElementNode(node as ElementNode, status, b, parentName, anchorName, root);
      break;
    }
    case "text": {
      buildTextNode(node as TextNode, status, b, parentName, anchorName);
      break;
    }
    case "special": {
      buildSpecialNode(node as ElementNode, status, b, parentName, anchorName);
      break;
    }
    default: {
      throw new Error(`Invalid node type: ${node.type}`);
    }
  }
}
