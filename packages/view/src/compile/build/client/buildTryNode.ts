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

	// Filter non-control branches (spaces)
	const branches = node.children.filter((n) => isControlNode(n)) as ControlNode[];

	const tryBranch = branches.find((n) => n.operation === "@try")!;
	const catchBranch = branches.find((n) => n.operation === "@catch");

	status.imports.add("t_region");
	status.imports.add("t_run_try");

	b.append("");
	b.append("/* @try */");

	addPushDevBoundary("control", "@try", status, b);

	b.append(`
		const ${regionName} = t_region(${status.options.dev === true ? `"try"` : ""});
		t_run_try(${regionName}, ${anchorName}, (${status.inHead ? "" : "t_before"}) => {`);

	buildTryBranchBody(tryBranch, status, b, parentName);

	// Close the try callback; open the catch callback (or pass null). The
	// catch variable becomes the callback's second parameter
	const catchVar = catchBranch
		? trimMatched(catchBranch.statement.substring("catch".length).trim(), "(", ")") || "err"
		: null;
	if (catchBranch && catchVar) {
		addMappedText(
			"},",
			`(${status.inHead ? "" : "t_before"}, ${replaceForVarNames(catchVar, status)}) => {`,
			"",
			catchBranch.span,
			status,
			b,
		);
		buildTryBranchBody(catchBranch, status, b, parentName);
		b.append(`}${status.options.dev === true ? `, "runTry"` : ""});`);
	} else {
		// No catch branch: errors propagate up to the nearest boundary
		b.append(`}, null${status.options.dev === true ? `, "runTry"` : ""});`);
	}

	addPopDevBoundary(status, b);

	b.append("");
}

function buildTryBranchBody(
	node: ControlNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
): void {
	// NOTE: no region push here — the branch region is pushed by `runTry`'s
	// `renderBranch` (the same shape as `@await` branches), so that the
	// branch's node window and effects land on the region that
	// `runControlBranch` clears
	if (node.children.length > 0) {
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
	}
}
