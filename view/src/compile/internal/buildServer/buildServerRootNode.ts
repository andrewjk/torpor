import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../Builder";
import BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

export default function buildServerRootNode(
  node: ControlNode,
  status: BuildServerStatus,
  b: Builder,
) {
  buildServerNode(node.children[0], status, b);
}
