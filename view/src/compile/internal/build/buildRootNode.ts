import type ControlNode from "../../types/nodes/ControlNode";
import BuildStatus from "./BuildStatus";
import Builder from "./Builder";
import addFragment from "./addFragment";
import buildNode from "./buildNode";
import declareFragment from "./declareFragment";

export default function buildRootNode(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  declareFragment(node, status, b);

  status.fragmentStack.push({
    fragment: node.fragment,
    path: "0:ch/",
  });
  buildNode(node.children[0], status, b, parentName, anchorName, true);
  status.fragmentStack.pop();

  addFragment(node, status, b, parentName, anchorName);
}
