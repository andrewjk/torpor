import { type ControlNode } from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import nextVarName from "../utils/nextVarName";
import { type BuildStatus } from "./BuildStatus";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import replaceForVarNames from "./replaceForVarNames";

export default function buildReplaceNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const replaceAnchorName = node.varName!;
	const replaceParentName = node.parentName || replaceAnchorName + ".parentNode";
	const replaceRangeName = nextVarName("replace_range", status);

	// HACK:
	node = node.children[0] as ControlNode;

	status.imports.add("t_range");
	status.imports.add("t_run_control");

	b.append("");
	b.append(`
	/* @replace */
	const ${replaceRangeName} = t_range();
	t_run_control(${replaceRangeName}, ${replaceAnchorName}, (t_before) => {`);

	buildReplaceBranch(node, status, b, replaceParentName, replaceRangeName);

	b.append("});");
	b.append("");
}

function buildReplaceBranch(
	node: ControlNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	rangeName: string,
) {
	status.imports.add("t_run_branch");

	b.append(`${replaceForVarNames(node.statement, status)};`);
	b.append(`t_run_branch(${rangeName}, -1, () => {`);

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
}
