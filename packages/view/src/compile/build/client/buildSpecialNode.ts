import { type ElementNode } from "../../types/nodes/ElementNode";
import Builder from "../../utils/Builder";
import { type BuildStatus } from "./BuildStatus";
import buildComponentNode from "./buildComponentNode";
import buildElementNode from "./buildElementNode";
import buildSlotNode from "./buildSlotNode";

export default function buildSpecialNode(
	node: ElementNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	root = false,
) {
	switch (node.tagName) {
		case "slot": {
			buildSlotNode(node, status, b);
			break;
		}
		case "fill": {
			// HACK:
			break;
		}
		case "@element": {
			buildElementNode(node, status, b, parentName, root);
			break;
		}
		case "@component": {
			buildComponentNode(node, status, b, root);
			break;
		}
		default: {
			// eslint-disable-next-line restrict-template-expressions
			throw new Error(`Invalid special node: ${node.tagName}`);
		}
	}
	return "";
}
