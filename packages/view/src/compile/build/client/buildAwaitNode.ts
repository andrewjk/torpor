import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import isControlNode from "../../utils/isControlNode";
import trimMatched from "../../utils/trimMatched";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import addMappedText from "./addMappedText";
import addPopDevBoundary from "./addPopDevBoundary";
import addPushDevBoundary from "./addPushDevBoundary";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import replaceForVarNames from "./replaceForVarNames";

export default function buildAwaitNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const anchorName = node.varName ?? "null";
	const parentName = node.parentName!;
	const regionName = nextVarName("await_region", status);
	const indexName = nextVarName("await_index", status);
	const tokenName = nextVarName("await_token", status);

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
			span: { start: 0, end: 0 },
		};
	}
	let catchBranch = branches.find((n) => n.operation === "@catch");
	if (!catchBranch) {
		catchBranch = {
			type: "control",
			operation: "@catch",
			statement: "catch",
			children: [],
			span: { start: 0, end: 0 },
		};
	}

	const awaiterName = trimMatched(awaitBranch.statement.substring("await".length).trim(), "(", ")");
	const thenVar = trimMatched(thenBranch.statement.substring("then".length).trim(), "(", ")");
	const catchVar = trimMatched(catchBranch.statement.substring("catch".length).trim(), "(", ")");

	// Use an incrementing token to make sure only the last request gets handled
	// TODO: This might have unforeseen consequences

	status.imports.add("t_region");
	status.imports.add("t_run_control");
	status.imports.add("t_clear");
	status.imports.add("t_push_region");
	status.imports.add("t_pop_region");

	b.append("");
	b.append("/* @await */");

	addPushDevBoundary("control", `@${branches[0].statement}`, status, b);

	b.append(`
		const ${regionName} = t_region(${status.options.dev === true ? `"await"` : ""});
		let ${tokenName} = 0;
		let ${indexName} = -1;
		t_run_control(${regionName}, ${anchorName}, (t_before) => {`);

	let index = 0;

	// Build the waiting branch before anything happens
	buildAwaitBranch(awaitBranch, status, b, parentName, regionName, indexName, index++);

	b.append(`
		${tokenName}++;
		((t_token) => {`);

	// TODO: replaceForVarNames is going to throw mapping out
	awaitBranch.span.start += "await".length + 2;
	addMappedText("", replaceForVarNames(awaiterName, status), "", awaitBranch.span, status, b);

	// TODO: replaceForVarNames is going to throw mapping out
	thenBranch.span.start -= 1;
	addMappedText(
		".then((",
		replaceForVarNames(thenVar, status),
		") => {",
		thenBranch.span,
		status,
		b,
	);

	b.append(`if (t_token === ${tokenName}) {`);
	buildAwaitBranch(thenBranch, status, b, parentName, regionName, indexName, index++);
	b.append(`}
		})`);

	// TODO: replaceForVarNames is going to throw mapping out
	catchBranch.span.start -= 1;
	addMappedText(
		".catch((",
		replaceForVarNames(catchVar, status),
		") => {",
		catchBranch.span,
		status,
		b,
	);

	b.append(`if (t_token === ${tokenName}) {`);
	buildAwaitBranch(catchBranch, status, b, parentName, regionName, indexName, index++);
	b.append(`}
				});
			})(${tokenName});
		}${status.options.dev === true ? `, "runAwait"` : ""});`);

	addPopDevBoundary(status, b);

	b.append("");
}

function buildAwaitBranch(
	node: ControlNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	regionName: string,
	indexName: string,
	index: number,
) {
	b.append(`if (${indexName} === ${index}) return;`);

	// HACK: This is bad -- it means that the parent region has been cleared,
	// but that should have cleared the effect that runs this child region??
	// TODO: Look into this further...
	b.append(`if (${regionName}.depth === -2) return;`);

	b.append(`
		if (${regionName}.nextRegion !== null && ${regionName}.nextRegion.depth > ${regionName}.depth) {
			t_clear(${regionName}.nextRegion);
		}`);

	if (node.children.length > 0) {
		// NOTE: for await branches, we need to push the control region again,
		// because it will have been popped by the time the `then` or `catch`
		// branches are hit
		b.append(`
			const t_new_region = t_region(${status.options.dev === true ? `"await_branch"` : ""});
			const t_old_control_region = t_push_region(${regionName});
			const t_old_region = t_push_region(t_new_region, true);
		`);

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

		b.append("t_pop_region(t_old_region);");
		b.append("t_pop_region(t_old_control_region);");
	}

	b.append(`${indexName} = ${index};`);
}
