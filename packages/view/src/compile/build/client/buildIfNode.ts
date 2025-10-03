import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import isControlNode from "../../utils/isControlNode";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import addMappedText from "./addMappedText";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import replaceForVarNames from "./replaceForVarNames";

// TODO: Are there too many branches for ifs etc?

export default function buildIfNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const anchorName = node.varName!;
	const parentName = node.parentName || anchorName + ".parentNode";
	const rangeName = nextVarName("if_range", status);
	const stateName = "$" + nextVarName("if_state", status);

	// Filter non-control branches (spaces)
	const branches = node.children.filter((n) => isControlNode(n)) as ControlNode[];

	// Add an else branch if there isn't one, so that the content will be cleared if no branches match
	if (branches.findIndex((n) => n.operation === "@else") === -1) {
		const elseBranch: ControlNode = {
			type: "control",
			operation: "@else",
			statement: "else",
			children: [],
			range: { start: 0, end: 0 },
		};
		branches.push(elseBranch);
	}

	status.imports.add("$watch");
	status.imports.add("$run");
	status.imports.add("t_range");
	status.imports.add("t_run_control");
	status.imports.add("t_run_branch");

	b.append("");
	b.append(`
		/* @if */
		const ${rangeName} = t_range();
		let ${stateName} = $watch({ creator: (_: Node | null) => {} });`);

	b.append(`$run(function runIf() {`);
	for (let branch of branches) {
		buildIfBranch(branch, status, b, parentName, stateName);
	}
	b.append(`});`);

	b.append(`
		t_run_control(${rangeName}, ${anchorName}, (t_before) => {
			t_run_branch(${rangeName}, () => ${stateName}.creator(t_before));
		});`);
	b.append("");
}

function buildIfBranch(
	node: ControlNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	stateName: string,
) {
	// TODO: replaceForVarNames is going to throw mapping out
	addMappedText(`${replaceForVarNames(node.statement, status)} {`, node.range, status, b);

	b.append(`${stateName}.creator = (t_before) => {`);

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

	b.append(`
			}
		}`);
}
