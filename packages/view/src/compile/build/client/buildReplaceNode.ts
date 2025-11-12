import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import replaceForVarNames from "./replaceForVarNames";

// TODO: type checking

export default function buildReplaceNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const replaceAnchorName = node.varName!;
	const replaceParentName = node.parentName || replaceAnchorName + ".parentNode";
	const replaceRegionName = nextVarName("replace_region", status);

	// HACK:
	node = node.children[0] as ControlNode;

	status.imports.add("t_region");
	status.imports.add("t_run_control");
	status.imports.add("t_run_branch");
	status.imports.add("t_push_region");
	status.imports.add("t_pop_region");

	b.append("");
	b.append(`
	/* @replace */
	const ${replaceRegionName} = t_region(${status.options.dev === true ? `"replace"` : ""});
	t_run_control(${replaceRegionName}, ${replaceAnchorName}, (t_before) => {`);

	buildReplaceBranch(node, status, b, replaceParentName, replaceRegionName);

	b.append(`}${status.options.dev === true ? ', "replace"' : ""});`);
	b.append("");
}

function buildReplaceBranch(
	node: ControlNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	regionName: string,
) {
	status.imports.add("t_run_branch");

	b.append(`${replaceForVarNames(node.statement, status)};`);
	b.append(`if (!t_run_branch(${regionName}, 0, -1)) return;`);

	b.append(`
		const t_new_region = t_region(${status.options.dev === true ? `"replace_branch"` : ""});
		const t_old_region = t_push_region(t_new_region, true);
	`);

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

	b.append("t_pop_region(t_old_region);");
}
