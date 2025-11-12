import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import isControlNode from "../../utils/isControlNode";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import addMappedText from "./addMappedText";
import addPopDevBoundary from "./addPopDevBoundary";
import addPushDevBoundary from "./addPushDevBoundary";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import replaceForVarNames from "./replaceForVarNames";

// TODO: Are there too many branches for ifs etc?

export default function buildIfNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const anchorName = node.varName ?? "null";
	const parentName = node.parentName || anchorName + ".parentNode";
	const regionName = nextVarName("if_region", status);
	const indexName = nextVarName("if_index", status);

	// Filter non-control branches (spaces)
	const branches = node.children.filter((n) => isControlNode(n)) as ControlNode[];

	// Add an else branch if there isn't one, so that the content will be cleared if no branches match
	if (branches.findIndex((n) => n.operation === "@else") === -1) {
		const elseBranch: ControlNode = {
			type: "control",
			operation: "@else",
			statement: "else",
			children: [],
			span: { start: 0, end: 0 },
		};
		branches.push(elseBranch);
	}

	status.imports.add("t_region");
	status.imports.add("t_run_control");
	status.imports.add("t_run_branch");
	status.imports.add("t_push_region");
	status.imports.add("t_pop_region");

	b.append("");
	b.append("/* @if */");

	addPushDevBoundary("control", `@${branches[0].statement}`, status, b);

	b.append(`
		const ${regionName} = t_region(${status.options.dev === true ? `"if"` : ""});
		let ${indexName} = -1;
		t_run_control(${regionName}, ${anchorName}, (t_before) => {`);

	let index = 0;
	for (let branch of branches) {
		buildIfBranch(branch, status, b, parentName, regionName, indexName, index++);
	}

	b.append(`}${status.options.dev === true ? `, "runIf"` : ""});`);

	addPopDevBoundary(status, b);

	b.append("");
}

function buildIfBranch(
	node: ControlNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	regionName: string,
	indexName: string,
	index: number,
) {
	// TODO: replaceForVarNames is going to throw mapping out
	addMappedText("", `${replaceForVarNames(node.statement, status)}`, " {", node.span, status, b);
	b.append(`if (!t_run_branch(${regionName}, ${indexName}, ${index})) return;`);

	if (node.children.length > 0) {
		b.append(`
			const t_new_region = t_region(${status.options.dev === true ? `"if_branch"` : ""});
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

	b.append(`${indexName} = ${index};`);
	b.append("}");
}
