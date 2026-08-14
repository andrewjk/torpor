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

export default function buildAwaitNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const anchorName = node.varName ?? "null";
	const parentName = node.parentName || anchorName + ".parentNode";
	const regionName = nextVarName("await_region", status);

	// Filter non-control branches (spaces)
	const branches = node.children.filter((n) => isControlNode(n)) as ControlNode[];
	const awaitBranch = branches.find((n) => n.operation === "@await");
	const withBranch = branches.find((n) => n.operation === "@with");

	status.imports.add("t_region");
	status.imports.add("t_run_await");

	b.append("");
	b.append("/* @await */");

	addPushDevBoundary("control", "@await", status, b);

	b.append(`
		const ${regionName} = t_region(${status.options.dev === true ? `"await"` : ""});
		t_run_await(${regionName}, ${anchorName}, (${status.inHead ? "" : "t_before"}) => {`);

	// Content branch children
	if (awaitBranch !== undefined && awaitBranch.children.length > 0) {
		buildFragment(awaitBranch, status, b, parentName, "t_before");
		status.fragmentStack.push({ fragment: awaitBranch.fragment, path: "" });
		for (let child of awaitBranch.children) {
			buildNode(child, status, b, parentName, "t_before");
		}
		status.fragmentStack.pop();
		buildAddFragment(awaitBranch, status, b, parentName, "t_before");
	}

	// Close content callback; open with-branch (or pass null)
	if (withBranch !== undefined) {
		b.append(`}, (${status.inHead ? "" : "t_before"}) => {`);
		if (withBranch.children.length > 0) {
			buildFragment(withBranch, status, b, parentName, "t_before");
			status.fragmentStack.push({ fragment: withBranch.fragment, path: "" });
			for (let child of withBranch.children) {
				buildNode(child, status, b, parentName, "t_before");
			}
			status.fragmentStack.pop();
			buildAddFragment(withBranch, status, b, parentName, "t_before");
		}
		b.append(`}${status.options.dev === true ? `, "runAwait"` : ""});`);
	} else {
		b.append(`}, null${status.options.dev === true ? `, "runAwait"` : ""});`);
	}

	addPopDevBoundary(status, b);
	b.append("");
}
