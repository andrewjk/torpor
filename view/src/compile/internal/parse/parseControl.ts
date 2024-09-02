import type ControlNode from "../../types/nodes/ControlNode";
import ElementNode from "../../types/nodes/ElementNode";
import type OperationType from "../../types/nodes/OperationType";
import isControlNode from "../../types/nodes/isControlNode";
import { trimStart } from "../utils";
import type ParseStatus from "./ParseStatus";
import addSpaceElement from "./addSpaceElement";
import parseElement from "./parseElement";
import { accept, addError, consumeSpace, isSpaceChar } from "./parseUtils";

const controlOperations = [
	"@if",
	"@else",
	"@for",
	"@key",
	"@switch",
	"@case",
	"@default",
	"@await",
	"@then",
	"@catch",
	"@const",
	"@console",
	"@debugger",
	"@function",
];

export default function parseControl(
	status: ParseStatus,
	parentNode: ElementNode | ControlNode,
): ControlNode {
	const node = parseControlOpen(status);

	// Some operations can't have children
	// TODO: Should probably make operations objects with this information
	if (
		node.operation === "@const" ||
		node.operation === "@console" ||
		node.operation === "@debugger" ||
		node.operation === "@function" ||
		node.operation === "@key"
	) {
		wrangleControlNode(node, parentNode);
		return node;
	}

	// Get the children
	for (status.i; status.i < status.source.length; status.i++) {
		addSpaceElement(node, status);
		const char = status.source[status.i];
		if (char === "}") {
			// It's the end of the control block, so we're done here
			break;
		} else if (char === "<") {
			// It's a child element
			const child = parseElement(status);
			node.children.push(child);
		} else if (char === "@") {
			const nextChars = status.source.substring(status.i, status.i + 3);
			if (nextChars === "@//") {
				// Swallow one-line comments
				status.i = status.source.indexOf("\n", status.i) + 1;
			} else if (nextChars === "@/*") {
				// Swallow multi-line comments
				status.i = status.source.indexOf("*/", status.i) + 2;
			} else {
				// It's a nested control
				parseControl(status, node);
			}
		} else if (accept("case", status, false) || accept("key", status, false)) {
			// case and key can be bare in a control block
			parseControl(status, node);
		} else {
			// Can't have text content in control blocks
			addError(status, `Unexpected token in control block: ${char}`, status.i);
			break;
		}
	}

	wrangleControlNode(node, parentNode);

	parseControlBranches(status, parentNode);

	return node;
}

function parseControlOpen(status: ParseStatus): ControlNode {
	const start = status.i;
	let operation = "";
	for (status.i; status.i < status.source.length; status.i++) {
		if (isSpaceChar(status.source, status.i)) {
			operation = status.source.substring(start, status.i);
			break;
		}
	}

	// Some operations (else etc) don't start with an @
	if (!operation.startsWith("@")) operation = "@" + operation;

	if (operation === "@default:") {
		operation = "@default";
	}

	if (operation.startsWith("@console.")) {
		status.i -= operation.length + 1;
		operation = "@console";
	}

	const node: ControlNode = {
		type: "control",
		operation: operation as OperationType,
		statement: "",
		children: [],
	};

	if (operation === "@function") {
		// TODO: Ignore chars in strings, comments and parentheses
		let braceCount = 0;
		for (status.i; status.i < status.source.length; status.i++) {
			const char = status.source[status.i];
			if (char === "{") {
				braceCount += 1;
			} else if (char === "}") {
				braceCount -= 1;
				if (braceCount === 0) {
					node.statement = status.source.substring(start + 1, status.i + 1).trim();
					status.i += 1;
					break;
				}
			}
		}
		return node;
	}

	if (controlOperations.includes(operation)) {
		// TODO: Ignore chars in strings, comments and parentheses
		let parenCount = 0;
		for (status.i; status.i < status.source.length; status.i++) {
			const char = status.source[status.i];
			if (char === "(") {
				parenCount += 1;
			} else if (char === ")") {
				parenCount -= 1;
			} else if (char === "{") {
				if (parenCount === 0) {
					node.statement = trimStart(status.source.substring(start, status.i).trim(), "@");
					status.i += 1;
					break;
				}
			} else if (
				char === "\n" &&
				(operation === "@const" ||
					operation === "@console" ||
					operation === "@debugger" ||
					operation === "@key")
			) {
				if (parenCount === 0) {
					node.statement = trimStart(status.source.substring(start, status.i).trim(), "@");
					status.i += 1;
					break;
				}
			}
		}
	} else {
		// TODO: Should probably advance until a lt
		addError(status, `Unknown operation: ${node.operation}`, status.i);
	}

	return node;
}

function wrangleControlNode(node: ControlNode, parentNode: ElementNode | ControlNode) {
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

function parseControlBranches(status: ParseStatus, parentNode: ElementNode | ControlNode) {
	// Look ahead and see if we have another control statement
	// TODO: Should be more strict here e.g. else should only be after an if
	let gotAnotherBranch = true;
	while (gotAnotherBranch) {
		let start = status.i;
		status.i += 1;
		consumeSpace(status);
		if (
			accept("else", status, false) ||
			accept("case", status, false) ||
			accept("default", status, false) ||
			accept("then", status, false) ||
			accept("catch", status, false)
		) {
			parseControl(status, parentNode);
		} else {
			gotAnotherBranch = false;
			status.i = start;
		}
	}
}
