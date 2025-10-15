import type ControlNode from "../types/nodes/ControlNode";
import type ElementNode from "../types/nodes/ElementNode";
import isSpecialNode from "../utils/isSpecialNode";
import voidTags from "../utils/voidTags";
import type ParseStatus from "./ParseStatus";
import addSpaceElement from "./addSpaceElement";
import parseControl from "./parseControl";
import parseTag from "./parseTag";
import parseText from "./parseText";
import slottifyChildNodes from "./slottifyChildNodes";
import accept from "./utils/accept";
import addError from "./utils/addError";
import consumeAlphaNumeric from "./utils/consumeAlphaNumeric";
import consumeSpace from "./utils/consumeSpace";

export default function parseElement(status: ParseStatus): ElementNode {
	const current = status.components.at(-1);
	if (!current) throw new Error("No component in stack");

	const start = status.i;

	const element = parseTag(status);

	if (element.tagName.startsWith("/")) {
		addError(
			status,
			`Non-matching close tag: ${element.tagName.substring(1)}`,
			start,
			start + element.tagName.length,
		);
		return element;
	}

	if (voidTags.includes(element.tagName)) {
		checkVoidElement(status, element);
	}

	if (!element.selfClosed && !voidTags.includes(element.tagName)) {
		status.stack.push(element);

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
				if (checkCloseTag(status, element)) {
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

		status.stack.pop();
	}

	// If this is a component element, add a default <fill> node
	// HACK: For now, we just treat all tags starting with a capital as components
	if (/[A-Z]/.test(element.tagName[0])) {
		element.type = "component";
		slottifyChildNodes(element);
	}

	if (isSpecialNode(element)) {
		if (element.tagName === "slot") {
			// If this is a <slot> element, add a <fill> node for its fallback
			// content. Anchors will be created for <slot> nodes and fragments will
			// be created for the <fill> content
			slottifyChildNodes(element);

			// Add it to the component's slots collection
			current.slotProps ??= [];
			current.slotProps.push(element.attributes.find((a) => a.name === "name")?.name ?? "default");
		} else if (element.tagName === "fill") {
			const fillSource = status.source.substring(start, status.i);
			element.hasSlotProps = /\$sprops\b/.test(fillSource);
		} else if (element.tagName === "@component") {
			const selfAttribute = element.attributes.find((a) => a.name === "self");
			if (selfAttribute && selfAttribute.value && selfAttribute.fullyReactive) {
				element.type = "component";
				slottifyChildNodes(element);

				const selfValue = selfAttribute.value;
				const replace: ControlNode = {
					type: "control",
					operation: "@replace",
					statement: selfValue,
					children: [element],
					range: { start: 0, end: 0 },
				};
				const replaceGroup: ControlNode = {
					type: "control",
					operation: "@replace group",
					statement: selfValue,
					children: [replace],
					range: { start: 0, end: 0 },
				};

				return replaceGroup as any;
			} else {
				addError(
					status,
					"@component element must have a self attribute",
					start,
					start + element.tagName.length + 1,
				);
			}
		}
	}

	if (!element.closed && !voidTags.includes(element.tagName)) {
		addError(
			status,
			`Unclosed non-void element: ${element.tagName}`,
			start,
			start + element.tagName.length + 1,
		);
	}

	return element;
}

function checkVoidElement(status: ParseStatus, element: ElementNode) {
	let i = status.i;

	consumeSpace(status);
	if (accept("</", status)) {
		consumeSpace(status);
		if (accept(element.tagName, status)) {
			addError(
				status,
				`Closed void element: ${element.tagName}`,
				i,
				i + element.tagName.length + 1,
			);
			consumeSpace(status);
			accept(">", status);
			return;
		}
	}

	status.i = i;
}

function checkCloseTag(status: ParseStatus, element: ElementNode) {
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
	for (let i = status.stack.length - 1; i >= 0; i--) {
		if (closingTagName === status.stack[i].tagName) {
			status.stack[i].closed = true;
			found = true;
			break;
		}
	}

	if (!found) {
		addError(
			status,
			`Non-matching close tag: ${closingTagName} (expected ${element.tagName})`,
			start,
			start + element.tagName.length + 1,
		);
	}

	return found;
}
