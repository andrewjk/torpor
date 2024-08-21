import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type Node from "../../types/nodes/Node";
import type RootNode from "../../types/nodes/RootNode";
import type TextNode from "../../types/nodes/TextNode";
import Builder from "../Builder";
import BuildServerStatus from "./BuildServerStatus";
//import buildServerComponentNode from "./buildServerComponentNode";
import buildServerControlNode from "./buildServerControlNode";
import buildServerElementNode from "./buildServerElementNode";
import buildServerRootNode from "./buildServerRootNode";
//import buildServerSpecialNode from "./buildServerSpecialNode";
import buildServerTextNode from "./buildServerTextNode";

export default function buildServerNode(node: Node, status: BuildServerStatus, b: Builder) {
  switch (node.type) {
    case "root": {
      buildServerRootNode(node as RootNode, status, b);
      break;
    }
    case "control": {
      buildServerControlNode(node as ControlNode, status, b);
      break;
    }
    case "component": {
      //buildComponentNode(node as ElementNode,b, root);
      break;
    }
    case "element": {
      buildServerElementNode(node as ElementNode, status, b);
      break;
    }
    case "text": {
      buildServerTextNode(node as TextNode, status, b);
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
