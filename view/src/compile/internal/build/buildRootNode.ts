import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../Builder";
import BuildStatus from "./BuildStatus";
import addFragment from "./buildAddFragment";
import declareFragment from "./buildDeclareFragment";
import buildNode from "./buildNode";

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
