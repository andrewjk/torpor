import type ParentNode from "../types/nodes/ParentNode";
import type TemplateNode from "../types/nodes/TemplateNode";
import isControlNode from "./isControlNode";

/**
 * Whether a markup tree contains an `@await` boundary, so the component's
 * render must be wrapped in a flush.
 */
export default function containsAwaitGroup(node: TemplateNode | undefined | null): boolean {
	if (node === undefined || node === null) {
		return false;
	}
	if (isControlNode(node) && node.operation === "@await group") {
		return true;
	}
	// Text and comment nodes have no children; everything else is a ParentNode
	if (node.type !== "text" && node.type !== "comment") {
		for (let child of (node as ParentNode).children) {
			if (containsAwaitGroup(child)) {
				return true;
			}
		}
	}
	return false;
}
