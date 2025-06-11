import { type ControlNode } from "../../types/nodes/ControlNode";
import isControlNode from "../../types/nodes/isControlNode";
import Builder from "../../utils/Builder";
import nextVarName from "../utils/nextVarName";
import { type BuildStatus } from "./BuildStatus";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import replaceForVarNames from "./replaceForVarNames";

export default function buildSwitchNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const switchParentName = node.parentName!;
	const switchAnchorName = node.varName!;
	const switchRangeName = nextVarName("switch_range", status);

	// Filter non-control branches (spaces)
	const branches = node.children.filter((n) => isControlNode(n)) as ControlNode[];

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

	status.imports.add("t_range");
	status.imports.add("t_run_control");

	b.append("");
	b.append(`
	/* @switch */
	const ${switchRangeName} = t_range();
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

	b.append(`${replaceForVarNames(node.statement, status)} {`);
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

	buildAddFragment(node, status, b, parentName, "t_before");

	b.append(`});`);
	b.append(`break;`);
	b.append(`}`);
}
