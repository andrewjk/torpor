import type ElementNode from "../../types/nodes/ElementNode";
import Builder from "../Builder";
import type BuildStatus from "./BuildStatus";
import buildElementNode from "./buildElementNode";
import buildSlotNode from "./buildSlotNode";

export default function buildSpecialNode(
	node: ElementNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
	root = false,
) {
	switch (node.tagName) {
		case ":element": {
			buildElementNode(node, status, b, parentName, anchorName, root);
			break;
		}
		case ":slot": {
			buildSlotNode(node, status, b, parentName, anchorName);
			break;
		}
		default: {
			throw new Error(`Invalid special node: ${node.tagName}`);
		}
	}
	return "";
}
