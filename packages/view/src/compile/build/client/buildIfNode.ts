import { type ControlNode } from "../../types/nodes/ControlNode";
import isControlNode from "../../types/nodes/isControlNode";
import Builder from "../../utils/Builder";
import nextVarName from "../utils/nextVarName";
import { type BuildStatus } from "./BuildStatus";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";

// TODO: Are there too many branches for ifs etc?

export default function buildIfNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const ifAnchorName = node.varName!;
	const ifParentName = node.parentName || ifAnchorName + ".parentNode";
	const ifRangeName = nextVarName("if_range", status);

	// Filter non-control branches (spaces)
	const branches = node.children.filter((n) => isControlNode(n)) as ControlNode[];

	// Add an else branch if there isn't one, so that the content will be cleared if no branches match
	if (branches.findIndex((n) => n.operation === "@else") === -1) {
		const elseBranch: ControlNode = {
			type: "control",
			operation: "@else",
			statement: "else",
			children: [],
		};
		branches.push(elseBranch);
	}

	status.imports.add("t_range");
	status.imports.add("t_run_control");

	b.append("");
	b.append(`
	/* @if */
	const ${ifRangeName} = t_range();
	t_run_control(${ifRangeName}, ${ifAnchorName}, (t_before) => {`);

	for (let [i, branch] of branches.entries()) {
		buildIfBranch(branch, status, b, ifParentName, ifRangeName, i);
	}

	b.append("});");
	b.append("");
}

function buildIfBranch(
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

	buildAddFragment(node, status, b, parentName, "t_before");

	b.append(`});`);
	b.append(`}`);
}
