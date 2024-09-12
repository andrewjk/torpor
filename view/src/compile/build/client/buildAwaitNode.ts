import Builder from "../../Builder";
import type ControlNode from "../../types/nodes/ControlNode";
import isControlNode from "../../types/nodes/isControlNode";
import { trimMatched } from "../../utils";
import { nextVarName } from "../buildUtils";
import type BuildStatus from "./BuildStatus";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";

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
	const branches = node.children.filter((n) => isControlNode(n)) as ControlNode[];

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
	status.imports.add("t_run_control");
	b.append("");
	b.append(`
	/* @await */
	const ${awaitRangeName} = { index: -1 };
	let ${awaitTokenName} = 0;
	t_run_control(${awaitRangeName}, ${awaitAnchorName}, (t_before) => {
		${awaitTokenName}++;`);

	buildAwaitBranch(awaitBranch, status, b, awaitParentName, awaitRangeName, 0);

	status.imports.add("t_push_range");
	status.imports.add("t_pop_range");
	b.append(`
	((token) => {
		${awaiterName}
		.then((${thenVar}) => {
		if (token === ${awaitTokenName}) {
			let ${oldRangeName} = t_push_range(${awaitRangeName});`);

	buildAwaitBranch(thenBranch, status, b, awaitParentName, awaitRangeName, 1);

	b.append(`t_pop_range(${oldRangeName});
		}
	})
	.catch((${catchVar}) => {
		if (token === ${awaitTokenName}) {
			let ${oldRangeName} = t_push_range(${awaitRangeName});`);

	buildAwaitBranch(catchBranch, status, b, awaitParentName, awaitRangeName, 2);

	b.append(`t_pop_range(${oldRangeName});
				}
			});
		})(${awaitTokenName});
	});`);
	b.append("");
}

function buildAwaitBranch(
	node: ControlNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	rangeName: string,
	index: number,
) {
	status.imports.add("t_run_branch");

	b.append(`t_run_branch(${rangeName}, ${index}, () => {`);

	buildFragment(node, status, b, parentName, "t_before");

	status.fragmentStack.push({
		fragment: node.fragment!,
		path: "",
	});
	for (let child of node.children) {
		buildNode(child, status, b, parentName, "t_before");
	}
	status.fragmentStack.pop();

	buildAddFragment(node, status, b, parentName, "t_before");

	b.append(`});`);
}
