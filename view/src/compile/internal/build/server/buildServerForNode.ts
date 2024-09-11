import type ControlNode from "../../../types/nodes/ControlNode";
import isControlNode from "../../../types/nodes/isControlNode";
import Builder from "../../Builder";
import {
	ANCHOR_COMMENT,
	HYDRATION_BRANCH_COMMENT,
	HYDRATION_END_COMMENT,
	HYDRATION_START_COMMENT,
} from "../../comments";
import BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

export default function buildServerForNode(
	node: ControlNode,
	status: BuildServerStatus,
	b: Builder,
) {
	// Surround the entire control statement with bracketed comments, so that we
	// can skip to the end to set the anchor node when hydrating
	status.output += HYDRATION_START_COMMENT;

	if (status.output) {
		b.append(`$output += \`${status.output}\`;`);
		status.output = "";
	}

	// Build the for statement
	for (let [i, branch] of node.children.entries()) {
		if (isControlNode(branch)) {
			buildServerForBranch(branch, status, b);
		}
	}
	b.append("}");

	// End the control statement
	status.output += HYDRATION_END_COMMENT;

	// Add the anchor node
	status.output += ANCHOR_COMMENT;
}

function buildServerForBranch(node: ControlNode, status: BuildServerStatus, b: Builder) {
	b.append(`${node.statement} {`);

	// Separate spaces across boundaries with a careted comment
	status.output += HYDRATION_BRANCH_COMMENT;

	for (let child of node.children) {
		buildServerNode(child, status, b);
	}

	if (status.output) {
		b.append(`$output += \`${status.output}\`;`);
		status.output = "";
	}
}
