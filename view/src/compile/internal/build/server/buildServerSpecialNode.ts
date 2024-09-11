import type ElementNode from "../../../types/nodes/ElementNode";
import Builder from "../../Builder";
import type BuildServerStatus from "./BuildServerStatus";
import buildServerElementNode from "./buildServerElementNode";
import buildServerSlotNode from "./buildServerSlotNode";

export default function buildServerSpecialNode(
	node: ElementNode,
	status: BuildServerStatus,
	b: Builder,
) {
	switch (node.tagName) {
		case ":element": {
			buildServerElementNode(node, status, b);
			break;
		}
		case ":slot": {
			buildServerSlotNode(node, status, b);
			break;
		}
		default: {
			throw new Error(`Invalid special node: ${node.tagName}`);
		}
	}
}
