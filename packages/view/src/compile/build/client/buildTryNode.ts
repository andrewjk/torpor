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

export default function buildTryNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const anchorName = node.varName ?? "null";
	const parentName = node.parentName || anchorName + ".parentNode";
	const regionName = nextVarName("try_region", status);
	const indexName = nextVarName("try_index", status);

	// Filter non-control branches (spaces)
	const branches = node.children.filter((n) => isControlNode(n)) as ControlNode[];

	const tryBranch = branches.find((n) => n.operation === "@try")!;
	const catchBranch = branches.find((n) => n.operation === "@catch");

	status.imports.add("t_region");
	status.imports.add("t_run_control");
	status.imports.add("t_run_branch");
	status.imports.add("t_push_region");
	status.imports.add("t_pop_region");

	b.append("");
	b.append("/* @try */");

	addPushDevBoundary("control", "@try", status, b);

	b.append(`
		const ${regionName} = t_region(${status.options.dev === true ? `"try"` : ""});
		let ${indexName} = -1;
		t_run_control(${regionName}, ${anchorName}, (${status.inHead ? "" : "t_before"}) => {`);

	let index = 0;

	if (catchBranch) {
		// Snapshot the hydration cursor so the catch branch can resume
		// hydrating from where the try group started if the try branch throws
		// partway through its hydration walk.
		const snapshotName = nextVarName("hydration_snapshot", status);
		status.imports.add("t_save_hydration");
		status.imports.add("t_restore_hydration");
		b.append(`const ${snapshotName} = t_save_hydration();`);

		// The try content is guarded by a JS try/catch so that sync render
		// errors are caught by the catch branch
		addMappedText(
			"",
			`${replaceForVarNames(tryBranch.statement, status)}`,
			" {",
			tryBranch.span,
			status,
			b,
		);
		buildTryBranchBody(tryBranch, status, b, parentName, regionName, indexName, index++);

		b.append("} ");
		const catchVar = trimMatched(catchBranch.statement.substring("catch".length).trim(), "(", ")");
		// TODO: replaceForVarNames is going to throw mapping out
		addMappedText(
			"",
			`catch (${replaceForVarNames(catchVar, status)})`,
			" {",
			catchBranch.span,
			status,
			b,
		);

		// If the try content threw, the branch region it pushed is left
		// active/stale. Restore the control region as the active region and
		// rewind the hydration cursor before rendering the catch branch, and
		// force a re-render of the catch branch (the try's `t_run_branch` will
		// already have cleared the old content by the time we get here).
		b.append(`t_push_region(${regionName});`);
		b.append(`t_restore_hydration(${snapshotName});`);
		b.append(`${indexName} = -1;`);
		buildTryBranchBody(catchBranch, status, b, parentName, regionName, indexName, index++);
		b.append("}");
	} else {
		// No catch branch: just render the try content. Errors propagate up
		// to the nearest boundary.
		buildTryBranchBody(tryBranch, status, b, parentName, regionName, indexName, index++);
	}

	b.append(`}${status.options.dev === true ? `, "runTry"` : ""});`);

	addPopDevBoundary(status, b);

	b.append("");
}

function buildTryBranchBody(
	node: ControlNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	regionName: string,
	indexName: string,
	index: number,
) {
	b.append(`if (!t_run_branch(${regionName}, ${indexName}, ${index})) return;`);

	if (node.children.length > 0) {
		b.append(`
			const t_new_region = t_region(${status.options.dev === true ? `"try_branch"` : ""});
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
}
