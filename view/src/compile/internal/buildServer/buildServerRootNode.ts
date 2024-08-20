import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../Builder";
import buildServerNode from "./buildServerNode";

export default function buildServerRootNode(node: ControlNode, b: Builder) {
  buildServerNode(node.children[0], b, true);
}
