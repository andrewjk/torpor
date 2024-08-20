import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../Builder";
import BuildStatus from "./BuildStatus";
import addFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";

export default function buildRootNode(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  buildFragment(node, status, b, parentName, anchorName);

  status.fragmentStack.push({
    fragment: node.fragment,
    path: "0:ch/",
  });
  buildNode(node.children[0], status, b, parentName, anchorName, true);
  status.fragmentStack.pop();

  addFragment(node, status, b, parentName, anchorName);
}
