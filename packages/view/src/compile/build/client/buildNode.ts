import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type RootNode from "../../types/nodes/RootNode";
import type TemplateNode from "../../types/nodes/TemplateNode";
import type TextNode from "../../types/nodes/TextNode";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";
import buildComponentNode from "./buildComponentNode";
import buildControlNode from "./buildControlNode";
import buildElementNode from "./buildElementNode";
import buildRootNode from "./buildRootNode";
import buildSpecialNode from "./buildSpecialNode";
import buildTextNode from "./buildTextNode";

export default function buildNode(
	node: TemplateNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
	root = false,
): void {
	// Nodes with anchors will have been handled when their containing fragment
	// was built so we want to skip them here
	if (node.handled) {
		node.handled = false;
		return;
	}

	switch (node.type) {
		case "root": {
			buildRootNode(node as RootNode, status, b, parentName, anchorName);
			break;
		}
		case "control": {
			buildControlNode(node as ControlNode, status, b);
			break;
		}
		case "component": {
			buildComponentNode(node as ElementNode, status, b, root);
			break;
		}
		case "element": {
			buildElementNode(node as ElementNode, status, b, parentName, root);
			break;
		}
		case "text": {
			buildTextNode(node as TextNode, status);
			break;
		}
		case "special": {
			buildSpecialNode(node as ElementNode, status, b, parentName, root);
			break;
		}
		default: {
			// eslint-disable-next-line restrict-template-expressions
			throw new Error(`Invalid node type: ${node.type}`);
		}
	}
}
