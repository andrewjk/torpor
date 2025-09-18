import {
	ANCHOR_COMMENT,
	HYDRATION_END_COMMENT,
	HYDRATION_START_COMMENT,
} from "../../types/comments";
import type ControlNode from "../../types/nodes/ControlNode";
import isControlNode from "../../utils/isControlNode";
import type BuildServerStatus from "./BuildServerStatus";

export default function buildServerHtmlNode(node: ControlNode, status: BuildServerStatus): void {
	// Surround the entire control statement with bracketed comments, so that we
	// can skip to the end to set the anchor node when hydrating
	status.output += HYDRATION_START_COMMENT;

	// Build the html statement
	for (let branch of node.children) {
		if (isControlNode(branch)) {
			status.output += `\${${branch.statement}}`;
		}
	}

	// End the control statement
	status.output += HYDRATION_END_COMMENT;

	// Add the anchor node
	status.output += ANCHOR_COMMENT;
}
