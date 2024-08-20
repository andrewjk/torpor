import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type Node from "../../types/nodes/Node";
import type TextNode from "../../types/nodes/TextNode";
import Builder from "../Builder";
//import buildServerComponentNode from "./buildServerComponentNode";
import buildServerControlNode from "./buildServerControlNode";
import buildServerElementNode from "./buildServerElementNode";
//import buildServerSpecialNode from "./buildServerSpecialNode";
import buildServerTextNode from "./buildServerTextNode";

export default function buildServerNode(node: Node, b: Builder, root = false) {
  switch (node.type) {
    case "control": {
      buildServerControlNode(node as ControlNode, b);
      break;
    }
    case "component": {
      //buildComponentNode(node as ElementNode,b, root);
      break;
    }
    case "element": {
      buildServerElementNode(node as ElementNode, b, root);
      break;
    }
    case "text": {
      buildServerTextNode(node as TextNode, b);
      break;
    }
    case "special": {
      //buildSpecialNode(node as ElementNode,b);
      break;
    }
    default: {
      throw new Error(`Invalid node type: ${node.type}`);
    }
  }
}
