import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import isControlNode from "../../types/nodes/isControlNode";

export default function wrangleControlNode(
	node: ControlNode,
	parentNode: ElementNode | ControlNode,
) {
	// HACK: Wrangle if/then/else into an if group, for into a for group, and
	// await/then/catch into an await group
	if (node.operation === "@if") {
		const ifGroup: ControlNode = {
			type: "control",
			operation: "@if group",
			statement: "",
			children: [node],
		};
		parentNode.children.push(ifGroup);
	} else if (node.operation === "@else") {
		if (/^else\s+if/.test(node.statement)) {
			node.operation = "@else if";
		}
		for (let i = parentNode.children.length - 1; i >= 0; i--) {
			const lastChild = parentNode.children[i];
			// TODO: Break if it's an element, do more checking
			if (isControlNode(lastChild) && lastChild.operation === "@if group") {
				lastChild.children.push(node);
				break;
			}
		}
		// @ts-ignore
	} else if (node.operation === "@for") {
		const forGroup: ControlNode = {
			type: "control",
			operation: "@for group",
			statement: "",
			children: [node],
		};
		parentNode.children.push(forGroup);
		// @ts-ignore
	} else if (node.operation === "@switch") {
		node.operation = "@switch group";
		parentNode.children.push(node);
	} else if (node.operation === "@await") {
		const awaitGroup: ControlNode = {
			type: "control",
			operation: "@await group",
			statement: "",
			children: [node],
		};
		parentNode.children.push(awaitGroup);
	} else if (node.operation === "@then" || node.operation === "@catch") {
		for (let i = parentNode.children.length - 1; i >= 0; i--) {
			const lastChild = parentNode.children[i];
			// TODO: Break if it's an element, do more checking
			if (isControlNode(lastChild) && lastChild.operation === "@await group") {
				lastChild.children.push(node);
				break;
			}
		}
	} else {
		parentNode.children.push(node);
	}
}
