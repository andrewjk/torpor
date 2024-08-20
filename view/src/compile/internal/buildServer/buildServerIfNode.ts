import type ControlNode from "../../types/nodes/ControlNode";
import isControlNode from "../../types/nodes/isControlNode";
import Builder from "../Builder";
import type BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

export default function buildServerIfNode(
  node: ControlNode,
  status: BuildServerStatus,
  b: Builder,
) {
  // Surround the entire control statement with bracketed comments, so that we
  // can skip to the end to set the anchor node when hydrating
  status.output += "<![>";

  if (status.output) {
    b.append(`$output += \`${status.output}\`;`);
    status.output = "";
  }

  // Build the if statement
  for (let [i, branch] of node.children.entries()) {
    if (isControlNode(branch)) {
      buildServerIfBranch(branch, status, b);
    }
  }

  // End the control statement
  status.output += "<!]>";

  // Add the anchor node
  status.output += "<!>";
}

function buildServerIfBranch(node: ControlNode, status: BuildServerStatus, b: Builder) {
  b.append(`${node.statement} {`);

  // Separate spaces across boundaries with a careted comment
  status.output += "<!^>";

  for (let child of node.children) {
    buildServerNode(child, status, b);
  }

  if (status.output) {
    b.append(`$output += \`${status.output}\`;`);
    status.output = "";
  }

  b.append("}");
}
