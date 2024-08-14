import type ControlNode from "../../types/nodes/ControlNode";
import { trimMatched } from "../utils";
import type BuildStatus from "./BuildStatus";
import Builder from "./Builder";
import addFragment from "./addFragment";
import buildNode from "./buildNode";
import { nextVarName } from "./buildUtils";
import declareFragment from "./declareFragment";

export default function buildAwaitNode(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  const awaitParentName = node.parentName!;
  const awaitAnchorName = node.varName!;
  const awaitRangeName = nextVarName("await_range", status);
  const awaitTokenName = nextVarName("await_token", status);
  const oldRangeName = nextVarName("old_range", status);

  // Filter non-control branches (spaces)
  const branches = node.children.filter((n) => n.type === "control") as ControlNode[];

  // Make sure all branches exist
  let awaitBranch = branches.find((n) => n.operation === "@await")!;
  if (!awaitBranch) {
    // TODO: Error handling
  }
  let thenBranch = branches.find((n) => n.operation === "@then");
  if (!thenBranch) {
    thenBranch = {
      type: "control",
      operation: "@then",
      statement: "then",
      children: [],
    };
  }
  let catchBranch = branches.find((n) => n.operation === "@catch");
  if (!catchBranch) {
    catchBranch = {
      type: "control",
      operation: "@catch",
      statement: "catch",
      children: [],
    };
  }

  const awaiterName = trimMatched(awaitBranch.statement.substring("await".length).trim(), "(", ")");
  const thenVar = trimMatched(thenBranch.statement.substring("then".length).trim(), "(", ")");
  const catchVar = trimMatched(catchBranch.statement.substring("catch".length).trim(), "(", ")");

  // Use an incrementing token to make sure only the last request gets handled
  // TODO: This might have unforeseen consequences
  b.append("");
  b.append(`
    /* @await */
    const ${awaitRangeName} = { index: -1 };
    let ${awaitTokenName} = 0;
    t_run_control(${awaitRangeName}, () => {
      ${awaitTokenName}++;`);

  buildAwaitBranch(awaitBranch, status, b, awaitParentName, awaitAnchorName, awaitRangeName, 0);

  b.append(`
    ((token) => {
      ${awaiterName}
      .then((${thenVar}) => {
      if (token === ${awaitTokenName}) {
        let ${oldRangeName} = t_push_range(${awaitRangeName});`);

  buildAwaitBranch(thenBranch, status, b, awaitParentName, awaitAnchorName, awaitRangeName, 1);

  b.append(`t_pop_range(${oldRangeName});
      }
    })
    .catch((${catchVar}) => {
      if (token === ${awaitTokenName}) {
        let ${oldRangeName} = t_push_range(${awaitRangeName});`);

  buildAwaitBranch(catchBranch, status, b, awaitParentName, awaitAnchorName, awaitRangeName, 2);

  b.append(`t_pop_range(${oldRangeName});
          }
        });
      })(${awaitTokenName});
    });`);
}

function buildAwaitBranch(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
  rangeName: string,
  index: number,
) {
  b.append(`t_run_branch(${rangeName}, ${index}, () => {`);

  declareFragment(node, status, b);

  status.fragmentStack.push({
    fragment: node.fragment!,
    path: "",
  });
  for (let child of node.children) {
    buildNode(child, status, b, parentName, anchorName);
  }
  status.fragmentStack.pop();

  addFragment(node, status, b, parentName, anchorName);

  b.append(`});`);
}
