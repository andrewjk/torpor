import type ControlNode from "../../types/nodes/ControlNode";
import type BuildStatus from "./BuildStatus";
import Builder from "./Builder";
import addFragment from "./addFragment";
import buildNode from "./buildNode";
import { nextVarName } from "./buildUtils";
import declareFragment from "./declareFragment";

export default function buildSwitchNode(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  const switchParentName = node.parentName!;
  const switchAnchorName = node.varName!;
  const switchRangeName = nextVarName("switch_range", status);

  // Filter non-control branches (spaces)
  const branches = node.children.filter((n) => n.type === "control") as ControlNode[];

  // Add a default branch if there isn't one, so that the content will be cleared if no branches match
  if (branches.findIndex((n) => n.operation === "@default") === -1) {
    const defaultBranch: ControlNode = {
      type: "control",
      operation: "@default",
      statement: "default",
      children: [],
    };
    branches.push(defaultBranch);
  }

  b.append("");
  b.append(`
      /* @switch */
      const ${switchRangeName} = {};
      t_run_control(${switchRangeName}, () => {
        ${node.statement} {`);

  for (let [i, branch] of branches.entries()) {
    buildSwitchBranch(
      branch as ControlNode,
      status,
      b,
      switchParentName,
      switchAnchorName,
      switchRangeName,
      i,
    );
  }

  b.append(`}
    });`);
}

function buildSwitchBranch(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
  rangeName: string,
  index: number,
) {
  b.append(`${node.statement} {`);
  b.append(`t_run_branch(${rangeName}, ${index}, () => {`);

  declareFragment(node, status, b);

  status.fragmentStack.push({
    fragment: node.fragment,
    path: "",
  });
  for (let child of node.children) {
    buildNode(child, status, b, parentName, anchorName);
  }
  status.fragmentStack.pop();

  addFragment(node, status, b, parentName, anchorName);

  b.append(`});`);
  b.append(`break;`);
  b.append(`}`);
}
