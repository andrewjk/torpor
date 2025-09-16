import { type ControlNode } from "../types/nodes/ControlNode";
import { type ElementNode } from "../types/nodes/ElementNode";
import { type TextNode } from "../types/nodes/TextNode";
import isSpecialNode from "../types/nodes/isSpecialNode";
import isTextNode from "../types/nodes/isTextNode";
import endOfString from "../utils/endOfString";
import endOfTemplateString from "../utils/endOfTemplateString";
import voidTags from "../utils/voidTags";
import { type ParseStatus } from "./ParseStatus";
import { type ParseComponentStatus } from "./ParseStatus";
import addSpaceElement from "./addSpaceElement";
import parseControl from "./parseControl";
import parseTag from "./parseTag";
import slottifyChildNodes from "./slottifyChildNodes";
import accept from "./utils/accept";
import addError from "./utils/addError";
import consumeAlphaNumeric from "./utils/consumeAlphaNumeric";
import consumeSpace from "./utils/consumeSpace";
import isSpaceChar from "./utils/isSpaceChar";

export default function parseElement(status: ParseStatus): ElementNode {
	const current = status.components.at(-1);
	if (!current) throw new Error("No component in stack");

	const start = status.i;

	const element = parseTag(status);

	if (element.tagName.startsWith("/")) {
		addError(status, `Non-matching close tag: ${element.tagName.substring(1)}`, start);
		return element;
	}

	if (voidTags.includes(element.tagName)) {
		checkVoidElement(status, element);
	}

	if (!element.selfClosed && !voidTags.includes(element.tagName)) {
		current.stack ??= [];
		current.stack.push(element);

		// Get the children
		while (status.i < status.source.length) {
			addSpaceElement(element, status);
			if (accept("}", status, false)) {
				// That's the rendering done
				break;
			} else if (accept("<!--", status)) {
				// It's a comment, swallow it
				status.i = status.source.indexOf("-->", status.i) + 3;
			} else if (accept("@//", status)) {
				// Swallow one-line comments
				status.i = status.source.indexOf("\n", status.i) + 1;
			} else if (accept("@/*", status)) {
				// Swallow block comments
				status.i = status.source.indexOf("*/", status.i) + 2;
			} else if (accept("</", status, false)) {
				// It's a close tag, so we're done here
				if (checkCloseTag(status, element, current)) {
					break;
				}
			} else if (accept("<", status, false)) {
				// It's a child element
				const child = parseElement(status);
				element.children.push(child);
			} else if (accept("@", status, false)) {
				// It's a control statement
				parseControl(status, element);
			} else {
				// It's text content
				parseText(status, element);
			}
		}

		current!.stack.pop();
	}

	// If this is a component element, add a default <fill> node
	// HACK: For now, we just treat all tags starting with a capital as components
	if (/[A-Z]/.test(element.tagName[0])) {
		element.type = "component";
		slottifyChildNodes(element);
		current.needsContext = true;
	}

	if (isSpecialNode(element)) {
		if (element.tagName === "slot") {
			// If this is a <slot> element, add a <fill> node for its fallback
			// content. Anchors will be created for <slot> nodes and fragments will
			// be created for the <fill> content
			slottifyChildNodes(element);
			current.needsContext = true;

			// Add it to the component's slots collection
			current.slotProps ??= [];
			current.slotProps.push(element.attributes.find((a) => a.name === "name")?.name ?? "default");
		} else if (element.tagName === "@component") {
			const selfAttribute = element.attributes.find((a) => a.name === "self");
			if (selfAttribute && selfAttribute.value && selfAttribute.fullyReactive) {
				element.type = "component";
				slottifyChildNodes(element);
				current.needsContext = true;

				const selfValue = selfAttribute.value;
				const replace: ControlNode = {
					type: "control",
					operation: "@replace",
					statement: selfValue,
					children: [element],
				};
				const replaceGroup: ControlNode = {
					type: "control",
					operation: "@replace group",
					statement: selfValue,
					children: [replace],
				};

				return replaceGroup as any;
			} else {
				addError(status, "@component element must have a self attribute", start);
			}
		}
	}

	if (!element.closed && !voidTags.includes(element.tagName)) {
		addError(status, `Unclosed non-void element: ${element.tagName}`, start);
	}

	return element;
}

function parseText(status: ParseStatus, element: ElementNode) {
	const start = status.i;
	// It ends at the next element, or at the next control statement, or at the end of
	// the render
	// But only if the control statement is after a newline, so we don't mess with
	// emails etc. This may need more finessing
	let end = -1;
	for (let j = status.i; j < status.source.length; j++) {
		if (status.source[j] === "}") {
			// That's the rendering done
			end = j;
		} else if (status.source[j] === "{") {
			// Skip reactive content
			let level = 0;
			for (let k = j; k < status.source.length; k++) {
				const char = status.source[k];
				const nextChar = status.source[k + 1];
				if (char === "/" && nextChar === "/") {
					// Skip one-line comments
					k = status.source.indexOf("\n", k);
				} else if (char === "/" && nextChar === "*") {
					// Skip block comments
					k = status.source.indexOf("*/", k) + 1;
				} else if (char === '"' || char === "'") {
					// Skip string contents
					k = endOfString(char, status.source, k);
				} else if (char === "`") {
					// Skip template string contents
					k = endOfTemplateString(status.source, k);
				} else if (char === "{") {
					level += 1;
				} else if (char === "}") {
					level -= 1;
					if (level === 0) {
						j = k;
						break;
					}
				}
			}
		} else if (status.source[j] === "<") {
			end = j;
		} else if (status.source[j] === "@") {
			// Backtrack
			for (let k = j - 1; k > status.i; k--) {
				if (status.source[k] === "\n") {
					end = j;
					break;
				} else if (!isSpaceChar(status.source, k)) {
					break;
				}
			}
		}
		if (end !== -1) {
			break;
		}
	}
	if (end !== -1) {
		const content = status.source.substring(start, end).trimEnd();
		const spaceContent = status.source.substring(start + content.length, end);
		if (content || spaceContent) {
			const previousNode = element.children[element.children.length - 1];
			if (previousNode && isTextNode(previousNode)) {
				previousNode.content += content + spaceContent;
			} else {
				const text: TextNode = {
					type: "text",
					content: content + spaceContent,
				};
				element.children.push(text);
			}
		}
		status.i = end;
	} else {
		status.i += 1;
	}
}

function checkVoidElement(status: ParseStatus, element: ElementNode) {
	let i = status.i;

	consumeSpace(status);
	if (accept("</", status)) {
		consumeSpace(status);
		if (accept(element.tagName, status)) {
			addError(status, `Closed void element: ${element.tagName}`, i);
			consumeSpace(status);
			accept(">", status);
			return;
		}
	}

	status.i = i;
}

function checkCloseTag(status: ParseStatus, element: ElementNode, current: ParseComponentStatus) {
	const start = status.i;

	accept("</", status);
	consumeSpace(status);
	let snailed = accept("@", status);
	let closingTagName = consumeAlphaNumeric(status);
	if (snailed) {
		closingTagName = "@" + closingTagName;
	}
	consumeSpace(status);
	accept(">", status);

	let found = false;
	if (current.stack) {
		for (let i = current.stack.length - 1; i >= 0; i--) {
			if (closingTagName === current.stack[i].tagName) {
				current.stack[i].closed = true;
				found = true;
				break;
			}
		}
	}
	if (!found) {
		addError(
			status,
			`Non-matching close tag: ${closingTagName} (expected ${element.tagName})`,
			start,
		);
	}

	return found;
}
