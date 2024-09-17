import Builder from "../../Builder";
import { ANCHOR_COMMENT, HYDRATION_END_COMMENT, HYDRATION_START_COMMENT } from "../../comments";
import type ControlNode from "../../types/nodes/ControlNode";
import isControlNode from "../../types/nodes/isControlNode";
import type BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

export default function buildServerIfNode(
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

	// Build the if statement
	for (let branch of node.children) {
		if (isControlNode(branch)) {
			buildServerIfBranch(branch, status, b);
		}
	}

	// End the control statement
	status.output += HYDRATION_END_COMMENT;

	// Add the anchor node
	status.output += ANCHOR_COMMENT;
}

function buildServerIfBranch(node: ControlNode, status: BuildServerStatus, b: Builder) {
	b.append(`${node.statement} {`);

	for (let child of node.children) {
		buildServerNode(child, status, b);
	}

	if (status.output) {
		b.append(`$output += \`${status.output}\`;`);
		status.output = "";
	}

	b.append("}");
}
