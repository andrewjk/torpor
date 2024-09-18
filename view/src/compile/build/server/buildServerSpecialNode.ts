import type ElementNode from "../../types/nodes/ElementNode";
import Builder from "../../utils/Builder";
import type BuildServerStatus from "./BuildServerStatus";
import buildServerComponentNode from "./buildServerComponentNode";
import buildServerElementNode from "./buildServerElementNode";
import buildServerSlotNode from "./buildServerSlotNode";

export default function buildServerSpecialNode(
	node: ElementNode,
	status: BuildServerStatus,
	b: Builder,
) {
	switch (node.tagName) {
		case ":slot": {
			buildServerSlotNode(node, status, b);
			break;
		}
		case ":element": {
			buildServerElementNode(node, status, b);
			break;
		}
		case ":component": {
			buildServerComponentNode(node, status, b);
			break;
		}
		default: {
			throw new Error(`Invalid special node: ${node.tagName}`);
		}
	}
}
