import type ElementNode from "../../types/nodes/ElementNode";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";
import buildComponentNode from "./buildComponentNode";
import buildElementNode from "./buildElementNode";
import buildHeadNode from "./buildHeadNode";
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
		case ":slot": {
			buildSlotNode(node, status, b, parentName, anchorName);
			break;
		}
		case ":element": {
			buildElementNode(node, status, b, parentName, anchorName, root);
			break;
		}
		case ":component": {
			buildComponentNode(node, status, b, parentName, anchorName, root);
			break;
		}
		case ":head": {
			buildHeadNode(node, status, b);
			break;
		}
		default: {
			throw new Error(`Invalid special node: ${node.tagName}`);
		}
	}
	return "";
}
