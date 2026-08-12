import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import isControlNode from "../../utils/isControlNode";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import addPopDevBoundary from "./addPopDevBoundary";
import addPushDevBoundary from "./addPushDevBoundary";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";

export default function buildLoadingNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const anchorName = node.varName ?? "null";
	const parentName = node.parentName || anchorName + ".parentNode";
	const regionName = nextVarName("loading_region", status);

	// Filter non-control branches (spaces)
	const branches = node.children.filter((n) => isControlNode(n)) as ControlNode[];
	const loadingBranch = branches.find((n) => n.operation === "@loading");
	const fallbackBranch = branches.find((n) => n.operation === "@fallback");

	status.imports.add("t_region");
	status.imports.add("t_run_loading");

	b.append("");
	b.append("/* @loading */");

	addPushDevBoundary("control", "@loading", status, b);

	b.append(`
		const ${regionName} = t_region(${status.options.dev === true ? `"loading"` : ""});
		t_run_loading(${regionName}, ${anchorName}, (${status.inHead ? "" : "t_before"}) => {`);

	// Content branch children
	if (loadingBranch !== undefined && loadingBranch.children.length > 0) {
		buildFragment(loadingBranch, status, b, parentName, "t_before");
		status.fragmentStack.push({ fragment: loadingBranch.fragment, path: "" });
		for (let child of loadingBranch.children) {
			buildNode(child, status, b, parentName, "t_before");
		}
		status.fragmentStack.pop();
		buildAddFragment(loadingBranch, status, b, parentName, "t_before");
	}

	// Close content callback; open fallback (or pass null)
	if (fallbackBranch !== undefined) {
		b.append(`}, (${status.inHead ? "" : "t_before"}) => {`);
		if (fallbackBranch.children.length > 0) {
			buildFragment(fallbackBranch, status, b, parentName, "t_before");
			status.fragmentStack.push({ fragment: fallbackBranch.fragment, path: "" });
			for (let child of fallbackBranch.children) {
				buildNode(child, status, b, parentName, "t_before");
			}
			status.fragmentStack.pop();
			buildAddFragment(fallbackBranch, status, b, parentName, "t_before");
		}
		b.append(`}${status.options.dev === true ? `, "runLoading"` : ""});`);
	} else {
		b.append(`}, null${status.options.dev === true ? `, "runLoading"` : ""});`);
	}

	addPopDevBoundary(status, b);
	b.append("");
}
