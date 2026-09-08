import {
	ANCHOR_COMMENT,
	HYDRATION_END_COMMENT,
	HYDRATION_START_COMMENT,
} from "../../types/comments";
import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import isControlNode from "../../utils/isControlNode";
import trimMatched from "../../utils/trimMatched";
import type BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";
import flushOutput from "./flushOutput";

export default function buildServerTryNode(
	node: ControlNode,
	status: BuildServerStatus,
	b: Builder,
): void {
	// Surround the entire control statement with bracketed comments, so that we
	// can skip to the end to set the anchor node when hydrating
	status.output += HYDRATION_START_COMMENT;

	flushOutput(status, b);

	const branches = node.children.filter((n) => isControlNode(n)) as ControlNode[];
	let tryBranch = branches.find((n) => n.operation === "@try");
	let catchBranch = branches.find((n) => n.operation === "@catch");

	if (catchBranch) {
		// Snapshot t_body and t_head so that any partially-flushed try output
		// is discarded if the try branch throws — including <head> tags
		// appended by child components or styles rendered before the throw
		b.append(`const t_try_body = t_body;`);
		b.append(`const t_try_head = t_head;`);
		b.append("try {");
		if (tryBranch) {
			buildServerTryBranch(tryBranch, status, b);
		}

		const catchVar = trimMatched(catchBranch.statement.substring("catch".length).trim(), "(", ")");
		b.append(`} catch (${catchVar || "err"}) {`);
		b.append("t_body = t_try_body;");
		b.append("t_head = t_try_head;");
		buildServerTryBranch(catchBranch, status, b);
		b.append("}");
	} else if (tryBranch) {
		buildServerTryBranch(tryBranch, status, b);
	}

	// End the control statement
	status.output += HYDRATION_END_COMMENT;

	// Add the anchor node
	status.output += ANCHOR_COMMENT;
}

function buildServerTryBranch(node: ControlNode, status: BuildServerStatus, b: Builder) {
	for (let child of node.children) {
		buildServerNode(child, status, b);
	}

	flushOutput(status, b);
}
