import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../Builder";
import type BuildServerStatus from "./BuildServerStatus";
//import buildServerAwaitNode from "./buildServerAwaitNode";
import buildServerForNode from "./buildServerForNode";
import buildServerIfNode from "./buildServerIfNode";
import buildServerScriptNode from "./buildServerScriptNode";
import buildServerSwitchNode from "./buildServerSwitchNode";

export default function buildServerControlNode(
	node: ControlNode,
	status: BuildServerStatus,
	b: Builder,
) {
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
		/*
		case "@await group": {
			buildServerAwaitNode(node, b);
			break;
		}
		case "@await":
		case "@then":
		case "@catch": {
			// These get handled with @await group, above
			break;
		}
		*/
		case "@const": {
			if (status.output) {
				b.append(`$output += \`${status.output}\`;`);
				status.output = "";
			}
			buildServerScriptNode(node, b);
			break;
		}
		case "@function": {
			if (status.output) {
				b.append(`$output += \`${status.output}\`;`);
				status.output = "";
			}
			b.append("");
			buildServerScriptNode(node, b);
			b.append("");
			break;
		}
		case "@console":
		case "@debugger": {
			// These can't be used on the server
			break;
		}
		default: {
			throw new Error(`Invalid operation: ${node.operation}`);
		}
	}
}
