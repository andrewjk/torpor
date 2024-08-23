import type ControlNode from "../../types/nodes/ControlNode";
import isControlNode from "../../types/nodes/isControlNode";
import Builder from "../Builder";
import BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

export default function buildServerSwitchNode(
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

  // Build the switch statement
  b.append(`${node.statement} {`);
  for (let [i, branch] of node.children.filter((c) => isControlNode(c)).entries()) {
    if (isControlNode(branch)) {
      buildServerSwitchBranch(branch, status, b);
    }
  }
  b.append("}");

  // End the control statement
  status.output += "<!]>";

  // Add the anchor node
  status.output += "<!>";
}

function buildServerSwitchBranch(node: ControlNode, status: BuildServerStatus, b: Builder) {
  b.append(`${node.statement} {`);

  for (let child of node.children) {
    buildServerNode(child, status, b);
  }

  if (status.output) {
    b.append(`$output += \`${status.output}\`;`);
    status.output = "";
  }

  b.append("break;");
  b.append("}");
}
