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

export default function buildSwitchNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const anchorName = node.varName ?? "null";
	const parentName = node.parentName!;
	const regionName = nextVarName("switch_region", status);
	const indexName = nextVarName("switch_index", status);

	// Filter non-control branches (spaces)
	const branches = node.children.filter((n) => isControlNode(n)) as ControlNode[];

	// Add a default branch if there isn't one, so that the content will be cleared if no branches match
	if (branches.findIndex((n) => n.operation === "@default") === -1) {
		const defaultBranch: ControlNode = {
			type: "control",
			operation: "@default",
			statement: "default",
			children: [],
			span: { start: 0, end: 0 },
		};
		branches.push(defaultBranch);
	}

	status.imports.add("t_region");
	status.imports.add("t_run_control");
	status.imports.add("t_run_branch");
	status.imports.add("t_push_region");
	status.imports.add("t_pop_region");

	b.append("");
	b.append("/* @switch */");

	addPushDevBoundary("control", `@${branches[0].statement}`, status, b);

	b.append(`
		const ${regionName} = t_region(${status.options.dev === true ? `"switch"` : ""});
		let ${indexName} = -1;
		t_run_control(${regionName}, ${anchorName}, (${status.inHead ? "" : "t_before"}) => {`);

	// TODO: replaceForVarNames is going to throw mapping out
	addMappedText("", `${replaceForVarNames(node.statement, status)}`, " {", node.span, status, b);

	let index = 0;
	for (let branch of branches) {
		buildSwitchBranch(branch, status, b, parentName, regionName, indexName, index++);
	}
	b.append(`
		}
	}${status.options.dev === true ? `, "runSwitch"` : ""});`);

	addPopDevBoundary(status, b);

	b.append("");
}

function buildSwitchBranch(
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
			const t_new_region = t_region(${status.options.dev === true ? `"switch_branch"` : ""});
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

	b.append(`
			${indexName} = ${index};
			break;
		}`);
}
