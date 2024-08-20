import type ControlNode from "../../types/nodes/ControlNode";
import isControlNode from "../../types/nodes/isControlNode";
import Builder from "./Builder";
import buildServerNode from "./buildServerNode";

export default function buildServerIfNode(node: ControlNode, b: Builder) {
  // Surround the entire control statement with bracketed comments, so that we
  // can skip to the end to set the anchor node when hydrating
  b.append(`$output += "<![>";`);

  // Build the if statement
  for (let [i, branch] of node.children.entries()) {
    if (isControlNode(branch)) {
      buildServerIfBranch(branch, b, i);
    }
  }

  // End the control statement
  b.append(`$output += "<!]>";`);

  // Add the anchor node
  b.append(`$output += "<!>";`);
}

function buildServerIfBranch(node: ControlNode, b: Builder, index: number) {
  b.append(`${node.statement} {`);

  // Separate spaces across boundaries with a careted comment
  b.append(`$output += "<!^>";`);

  for (let child of node.children) {
    buildServerNode(child, b);
  }

  b.append("}");
}
