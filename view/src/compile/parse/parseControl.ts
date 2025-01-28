import { type ControlNode } from "../types/nodes/ControlNode";
import { type ElementNode } from "../types/nodes/ElementNode";
import { type OperationType } from "../types/nodes/OperationType";
import isControlNode from "../types/nodes/isControlNode";
import trimMatched from "../utils/trimMatched";
import trimStart from "../utils/trimStart";
import { type ParseStatus } from "./ParseStatus";
import addSpaceElement from "./addSpaceElement";
import parseElement from "./parseElement";
import parseInlineScript from "./parseInlineScript";
import accept from "./utils/accept";
import addError from "./utils/addError";
import consumeSpace from "./utils/consumeSpace";
import isSpaceChar from "./utils/isSpaceChar";

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
	"@replace",
	"@html",
	"@const",
	"@console",
	"@debugger",
	"@function",
];

const standaloneOperations = ["@key", "@html", "@const", "@console", "@debugger", "@function"];

export default function parseControl(status: ParseStatus, parentNode: ElementNode | ControlNode) {
	const node = parseControlOpen(status);
	if (!node) {
		return;
	}

	// Some operations don't have children
	if (standaloneOperations.includes(node.operation)) {
		wrangleControlNode(node, parentNode);
		return;
	}

	// Get the children
	while (status.i < status.source.length) {
		addSpaceElement(node, status);
		if (accept("}", status)) {
			// It's the end of the control block, so we're done here
			break;
		} else if (accept("<", status, false)) {
			// It's a child element
			const child = parseElement(status);
			node.children.push(child);
		} else if (accept("@//", status)) {
			// Swallow one-line comments
			status.i = status.source.indexOf("\n", status.i) + 1;
		} else if (accept("@/*", status)) {
			// Swallow block comments
			status.i = status.source.indexOf("*/", status.i) + 2;
		} else if (accept("@", status, false)) {
			// It's a nested control
			parseControl(status, node);
		} else if (accept("case", status, false) || accept("key", status, false)) {
			// `case` and `key` can be bare in a control block
			parseControl(status, node);
		} else {
			// Can't have text content in control blocks
			const char = status.source[status.i];
			addError(status, `Unexpected token in control block: ${char}`, status.i);
			break;
		}
	}

	wrangleControlNode(node, parentNode);

	parseControlBranches(status, parentNode);
}

function parseControlOpen(status: ParseStatus): ControlNode | null {
	const start = status.i;

	let operation = "";
	for (status.i; status.i < status.source.length; status.i++) {
		const char = status.source[status.i];
		if (
			isSpaceChar(status.source, status.i) ||
			(accept(":", status) && operation === "default") ||
			(accept(".", status) && operation === "@console") ||
			(accept("(", status, false) && operation === "@html")
		) {
			break;
		}
		operation += char;
	}

	// Some operations (else etc) don't start with an @
	if (!operation.startsWith("@")) {
		operation = "@" + operation;
	}

	let statement = "";
	if (controlOperations.includes(operation)) {
		statement = parseControlStatement(start, operation, status);

		// Special processing for functions -- read until the closing brace
		if (operation === "@function") {
			statement += ` {${parseInlineScript(status)}}`;
			accept("}", status);
		}

		// Special processing for replace and html
		if (operation === "@replace" || operation === "@html") {
			statement = trimMatched(statement.substring(statement.indexOf("(")).trim(), "(", ")");
		}
	} else {
		// TODO: Should probably advance until a closing brace or a newline
		addError(status, `Unknown operation: ${operation}`, status.i);
		return null;
	}

	return {
		type: "control",
		operation: operation as OperationType,
		statement,
		children: [],
	};
}

function parseControlStatement(start: number, operation: string, status: ParseStatus) {
	let parenCount = 0;
	while (status.i < status.source.length) {
		if (accept("(", status)) {
			parenCount += 1;
		} else if (accept(")", status)) {
			parenCount -= 1;
		} else if (
			accept("{", status) ||
			(accept("\n", status) && standaloneOperations.includes(operation))
		) {
			if (parenCount === 0) {
				return trimStart(status.source.substring(start, status.i - 1).trim(), "@");
			}
		} else if (accept('"', status) || accept("'", status)) {
			// Skip string contents
			const char = status.source[status.i - 1];
			for (let j = status.i + 1; j < status.source.length; j++) {
				if (status.source[j] === char && status.source[j - 1] !== "\\") {
					status.i = j + 1;
					break;
				}
			}
		} else if (accept("`", status)) {
			// Skip possibly interpolated string contents
			let level2 = 0;
			for (let j = status.i + 1; j < status.source.length; j++) {
				if (status.source[j] === "`" && status.source[j - 1] !== "\\" && level2 === 0) {
					status.i = j + 1;
					break;
				} else if (status.source[j] === "{" && (level2 > 0 || status.source[j - 1] === "$")) {
					level2 += 1;
				} else if (status.source[j] === "}" && level2 > 0) {
					level2 -= 1;
				}
			}
		} else if (accept("//", status)) {
			// Ignore the content of one-line comments
			status.i = status.source.indexOf("\n", status.i) + 1;
		} else if (accept("/*", status)) {
			// Ignore the content of block comments
			status.i = status.source.indexOf("*/", status.i) + 2;
		} else {
			status.i += 1;
		}
	}
	return "";
}

/**
 * Groups the control node into the correct parent e.g. if/else into an if group
 * @param node The control node
 * @param parentNode The parent node
 */
function wrangleControlNode(node: ControlNode, parentNode: ElementNode | ControlNode) {
	// Group
	// * if/else into an if group
	// * for into a for group
	// * switch into a switch group (cases will have the correct parent)
	// * await/then/catch into an await group
	// * replace into a replace group
	// * html into a html group
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
	}
	// @ts-ignore
	else if (node.operation === "@for") {
		const forGroup: ControlNode = {
			type: "control",
			operation: "@for group",
			statement: "",
			children: [node],
		};
		parentNode.children.push(forGroup);
	}
	// @ts-ignore
	else if (node.operation === "@switch") {
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
	} else if (node.operation === "@replace") {
		const replaceGroup: ControlNode = {
			type: "control",
			operation: "@replace group",
			statement: "",
			children: [node],
		};
		parentNode.children.push(replaceGroup);
	} else if (node.operation === "@html") {
		const htmlGroup: ControlNode = {
			type: "control",
			operation: "@html group",
			statement: "",
			children: [node],
		};
		parentNode.children.push(htmlGroup);
	} else {
		parentNode.children.push(node);
	}
}

/**
 * Parses control branches that don't start with an @ symbol e.g. else or case
 * @param status The parse status
 * @param parentNode The parent node
 */
function parseControlBranches(status: ParseStatus, parentNode: ElementNode | ControlNode) {
	// Look ahead and see if we have another control statement
	// NOTE: We could be more strict here (e.g. we could check that an else is
	// after an if), but for now we are just leaving it to the JS parser
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
