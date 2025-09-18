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
): void {
	switch (node.tagName) {
		case "slot": {
			buildServerSlotNode(node, status, b);
			break;
		}
		case "fill": {
			// HACK:
			break;
		}
		case "@element": {
			buildServerElementNode(node, status, b);
			break;
		}
		case "@component": {
			buildServerComponentNode(node, status, b);
			break;
		}
		default: {
			// eslint-disable-next-line restrict-template-expressions
			throw new Error(`Invalid special node: ${node.tagName}`);
		}
	}
}
