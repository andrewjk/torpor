import {
	ANCHOR_COMMENT,
	HYDRATION_END_COMMENT,
	HYDRATION_START_COMMENT,
	hydrationBranchComment,
} from "../../types/comments";
import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import isControlNode from "../../utils/isControlNode";
import type BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";
import flushOutput from "./flushOutput";

export default function buildServerIfNode(
	node: ControlNode,
	status: BuildServerStatus,
	b: Builder,
): void {
	// Surround the entire control statement with bracketed comments, so that we
	// can skip to the end to set the anchor node when hydrating
	status.output += HYDRATION_START_COMMENT;

	flushOutput(status, b);

	// Build the if statement
	let index = 0;
	for (let branch of node.children) {
		if (isControlNode(branch)) {
			buildServerIfBranch(branch, status, b, index++);
		}
	}

	// End the control statement
	status.output += HYDRATION_END_COMMENT;

	// Add the anchor node
	status.output += ANCHOR_COMMENT;
}

function buildServerIfBranch(
	node: ControlNode,
	status: BuildServerStatus,
	b: Builder,
	index: number,
) {
	b.append(`${node.statement} {`);

	// Separate spaces across boundaries with a careted comment. The branch
	// index is written into it, so that hydration can detect when the client
	// picks a different branch than the server rendered
	status.output += hydrationBranchComment(index);

	for (let child of node.children) {
		buildServerNode(child, status, b);
	}

	flushOutput(status, b);

	b.append("}");
}
