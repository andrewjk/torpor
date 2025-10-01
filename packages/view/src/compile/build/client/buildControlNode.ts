import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";
import buildAwaitNode from "./buildAwaitNode";
import buildForNode from "./buildForNode";
import buildHtmlNode from "./buildHtmlNode";
import buildIfNode from "./buildIfNode";
import buildReplaceNode from "./buildReplaceNode";
import buildScriptNode from "./buildScriptNode";
import buildSwitchNode from "./buildSwitchNode";

export default function buildControlNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	switch (node.operation) {
		case "@if group": {
			buildIfNode(node, status, b);
			break;
		}
		case "@if":
		case "@else if":
		case "@else": {
			// These get handled with @if group, above
			break;
		}
		case "@switch group": {
			buildSwitchNode(node, status, b);
			break;
		}
		case "@case":
		case "@default": {
			// These get handled with @switch, above
			break;
		}
		case "@for group": {
			buildForNode(node, status, b);
			break;
		}
		case "@for":
		case "@key": {
			// These get handled with @for, above
			break;
		}
		case "@await group": {
			buildAwaitNode(node, status, b);
			break;
		}
		case "@await":
		case "@then":
		case "@catch": {
			// These get handled with @await group, above
			break;
		}
		case "@replace group": {
			buildReplaceNode(node, status, b);
			break;
		}
		case "@replace": {
			// This gets handled with @replace group, above
			break;
		}
		case "@html group": {
			buildHtmlNode(node, status, b);
			break;
		}
		case "@html": {
			// This gets handled with @html group, above
			break;
		}
		case "@const":
		case "@console":
		case "@debugger": {
			buildScriptNode(node, status, b);
			break;
		}
		case "@function":
		case "@async function": {
			b.append("");
			buildScriptNode(node, status, b);
			b.append("");
			break;
		}
		default: {
			// eslint-disable-next-line restrict-template-expressions
			throw new Error(`Invalid operation: ${node.operation}`);
		}
	}
}
