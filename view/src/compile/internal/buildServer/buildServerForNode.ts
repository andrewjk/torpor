import type ControlNode from "../../types/nodes/ControlNode";
import isControlNode from "../../types/nodes/isControlNode";
import Builder from "./Builder";
import buildServerNode from "./buildServerNode";

export default function buildServerForNode(node: ControlNode, b: Builder) {
  // Surround the entire control statement with bracketed comments, so that we
  // can skip to the end to set the anchor node when hydrating
  b.append(`$output += "<![>";`);

  // Build the for statement
  for (let [i, branch] of node.children.entries()) {
    if (isControlNode(branch)) {
      buildServerForBranch(branch, b);
    }
  }
  b.append("}");

  // End the control statement
  b.append(`$output += "<!]>";`);

  // Add the anchor node
  b.append(`$output += "<!>";`);
}

function buildServerForBranch(node: ControlNode, b: Builder) {
  b.append(`${node.statement} {`);

  // Separate spaces across boundaries with a careted comment
  b.append(`$output += "<!^>";`);

  for (let child of node.children) {
    buildServerNode(child, b);
  }
}
