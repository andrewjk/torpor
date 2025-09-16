import { type ControlNode } from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import { type BuildServerStatus } from "./BuildServerStatus";
import buildServerAwaitNode from "./buildServerAwaitNode";
import buildServerForNode from "./buildServerForNode";
import buildServerHtmlNode from "./buildServerHtmlNode";
import buildServerIfNode from "./buildServerIfNode";
import buildServerReplaceNode from "./buildServerReplaceNode";
import buildServerScriptNode from "./buildServerScriptNode";
import buildServerSwitchNode from "./buildServerSwitchNode";

export default function buildServerControlNode(
	node: ControlNode,
	status: BuildServerStatus,
	b: Builder,
): void {
	switch (node.operation) {
		case "@if group": {
			buildServerIfNode(node, status, b);
			break;
		}
		case "@if":
		case "@else if":
		case "@else": {
			// These get handled with @if group, above
			break;
		}
		case "@switch group": {
			buildServerSwitchNode(node, status, b);
			break;
		}
		case "@case":
		case "@default": {
			// These get handled with @switch, above
			break;
		}
		case "@for group": {
			buildServerForNode(node, status, b);
			break;
		}
		case "@for":
		case "@key": {
			// These get handled with @for, above
			break;
		}
		case "@await group": {
			buildServerAwaitNode(node, status, b);
			break;
		}
		case "@await":
		case "@then":
		case "@catch": {
			// These get handled with @await group, above
			break;
		}
		case "@replace group": {
			buildServerReplaceNode(node, status, b);
			break;
		}
		case "@replace": {
			// This gets handled with @replace group, above
			break;
		}
		case "@html group": {
			buildServerHtmlNode(node, status);
			break;
		}
		case "@html": {
			// This gets handled with @html group, above
			break;
		}
		case "@const": {
			if (status.output) {
				b.append(`t_body += \`${status.output}\`;`);
				status.output = "";
			}
			buildServerScriptNode(node, b);
			break;
		}
		case "@function":
		case "@async function": {
			if (status.output) {
				b.append(`t_body += \`${status.output}\`;`);
				status.output = "";
			}
			//b.append("/* eslint-disable */");
			b.append("");
			buildServerScriptNode(node, b);
			b.append("");
			//b.append("/* eslint-enable */");
			break;
		}
		case "@console":
		case "@debugger": {
			// These can't be used on the server
			break;
		}
		default: {
			// eslint-disable-next-line restrict-template-expressions
			throw new Error(`Invalid operation: ${node.operation}`);
		}
	}
}
