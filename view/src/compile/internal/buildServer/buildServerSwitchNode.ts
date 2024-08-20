import type ControlNode from "../../types/nodes/ControlNode";
import isControlNode from "../../types/nodes/isControlNode";
import Builder from "./Builder";
import buildServerNode from "./buildServerNode";

export default function buildServerSwitchNode(node: ControlNode, b: Builder) {
  // Surround the entire control statement with bracketed comments, so that we
  // can skip to the end to set the anchor node when hydrating
  b.append(`$output += "<![>";`);

  // Build the switch statement
  b.append(`${node.statement} {`);
  for (let [i, branch] of node.children.filter((c) => c.type === "control").entries()) {
    if (isControlNode(branch)) {
      buildServerSwitchBranch(branch, b, i);
    }
  }
  b.append("}");

  // End the control statement
  b.append(`$output += "<!]>";`);

  // Add the anchor node
  b.append(`$output += "<!>";`);
}

function buildServerSwitchBranch(node: ControlNode, b: Builder, index: number) {
  b.append(`${node.statement} {`);

  // Separate spaces across boundaries with a careted comment
  b.append(`$output += "<!^>";`);

  for (let child of node.children) {
    buildServerNode(child, b);
  }

  b.append("break;");
  b.append("}");
}
