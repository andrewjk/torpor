import type ControlNode from "../../types/nodes/ControlNode";
import isControlNode from "../../types/nodes/isControlNode";
import Builder from "../Builder";
import type BuildStatus from "./BuildStatus";
import addFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import { nextVarName } from "./buildUtils";

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
	const branches = node.children.filter((n) => isControlNode(n));

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

	status.imports.add("t_run_control");

	b.append("");
	b.append(`
      /* @switch */
      const ${switchRangeName} = {};
      t_run_control(${switchRangeName}, ${switchAnchorName}, (t_before) => {
        ${node.statement} {`);

	for (let [i, branch] of branches.entries()) {
		buildSwitchBranch(branch as ControlNode, status, b, switchParentName, switchRangeName, i);
	}

	b.append(`}
    });`);
	b.append("");
}

function buildSwitchBranch(
	node: ControlNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	rangeName: string,
	index: number,
) {
	status.imports.add("t_run_branch");

	b.append(`${node.statement} {`);
	b.append(`t_run_branch(${rangeName}, ${index}, () => {`);

	buildFragment(node, status, b, parentName, "t_before");

	status.fragmentStack.push({
		fragment: node.fragment,
		path: "",
	});
	for (let child of node.children) {
		buildNode(child, status, b, parentName, "t_before");
	}
	status.fragmentStack.pop();

	addFragment(node, status, b, parentName, "t_before");

	b.append(`});`);
	b.append(`break;`);
	b.append(`}`);
}
