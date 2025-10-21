import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import isControlNode from "../../utils/isControlNode";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import addDevBoundary from "./addDevBoundary";
import addMappedText from "./addMappedText";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import replaceForVarNames from "./replaceForVarNames";

export default function buildSwitchNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const anchorName = node.varName!;
	const parentName = node.parentName!;
	const rangeName = nextVarName("switch_range", status);
	const stateName = "$" + nextVarName("switch_state", status);
	const creatorsName = nextVarName("switch_creators", status);

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

	status.imports.add("$watch");
	status.imports.add("$run");
	status.imports.add("t_region");
	status.imports.add("t_run_control");
	status.imports.add("t_run_branch");

	b.append("");
	b.append(`
		/* @switch */
		const ${rangeName} = t_region(${status.options.dev === true ? `"${node.statement}"` : ""});
		let ${stateName} = $watch({ index: -1 });
		let ${creatorsName}: ((t_before: Node | null) => void)[] = [];`);

	addDevBoundary(`@${branches[0].statement}`, status, b);

	b.append("$run(() => {");

	let index = 0;

	// TODO: replaceForVarNames is going to throw mapping out
	addMappedText("", `${replaceForVarNames(node.statement, status)}`, " {", node.span, status, b);

	for (let branch of branches) {
		buildSwitchBranch(branch, status, b, parentName, stateName, creatorsName, index++);
	}
	b.append(`
		}
	}${status.options.dev === true ? `, "runSwitch"` : ""});`);

	b.append(`
		t_run_control(${rangeName}, ${anchorName}, (t_before) => {
			t_run_branch(${rangeName}, () => ${creatorsName}[${stateName}.index](t_before));
		});`);
	b.append("");
}

function buildSwitchBranch(
	node: ControlNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	stateName: string,
	creatorsName: string,
	index: number,
) {
	// TODO: replaceForVarNames is going to throw mapping out
	addMappedText("", `${replaceForVarNames(node.statement, status)}`, " {", node.span, status, b);

	if (node.children.length > 0) {
		b.append(`${creatorsName}[${index}] = (t_before) => {`);

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

		b.append("};");
	} else {
		b.append(`${creatorsName}[${index}] = (_) => {};`);
	}

	b.append(`${stateName}.index = ${index};`);
	b.append(`
			break;
		}`);
}
