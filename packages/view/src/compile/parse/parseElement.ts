import type CommentNode from "../types/nodes/CommentNode";
import type ControlNode from "../types/nodes/ControlNode";
import type ElementNode from "../types/nodes/ElementNode";
import type TextNode from "../types/nodes/TextNode";
import isRawTextTag from "../utils/rawTextTags";
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
import usesSlot from "./utils/usesSlot";

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

		// Raw-text elements aren't parsed as markup at all: everything up to
		// the closing tag is literal content
		if (isRawTextTag(element.tagName)) {
			parseRawText(status, element);
		}

		// Get the children
		while (status.i < status.source.length) {
			addSpaceElement(element, status);
			if (accept("}", status, false)) {
				// That's the rendering done
				break;
			} else if (accept("<!--", status)) {
				// It's a comment, swallow it
				const start = status.i;
				status.i = status.source.indexOf("-->", status.i) + 3;
				const text: CommentNode = {
					type: "comment",
					commentType: "html",
					content: status.source.substring(start, status.i - 3),
				};
				element.children.push(text);
			} else if (accept("@//", status)) {
				// Swallow one-line comments
				// Swallow one-line comments
				const start = status.i;
				status.i = status.source.indexOf("\n", status.i) + 1;
				const text: CommentNode = {
					type: "comment",
					commentType: "line",
					content: status.source.substring(start, status.i - 1),
				};
				element.children.push(text);
			} else if (accept("@/*", status)) {
				// Swallow block comments
				// Swallow block comments
				const start = status.i;
				status.i = status.source.indexOf("*/", status.i) + 2;
				const text: CommentNode = {
					type: "comment",
					commentType: "block",
					content: status.source.substring(start, status.i - 2),
				};
				element.children.push(text);
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
		} else if (element.tagName === "fill" || element.tagName === "filldef") {
			element.hasSlotProps = usesSlot(element.children);
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
					span: { start: 0, end: 0 },
				};
				const replaceGroup: ControlNode = {
					type: "control",
					operation: "@replace group",
					statement: selfValue,
					children: [replace],
					span: { start: 0, end: 0 },
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

/**
 * Consumes a raw-text element's content as a single literal text node. The
 * content ends at the first matching close tag (which the caller's child loop
 * then handles), or at the end of the source when the element is unclosed.
 */
function parseRawText(status: ParseStatus, element: ElementNode): void {
	const start = status.i;
	const end = findRawTextEnd(status.source, element.tagName, start);
	if (end > start) {
		const text: TextNode = {
			type: "text",
			content: status.source.substring(start, end),
			start,
			spans: [],
			raw: true,
		};
		element.children.push(text);
	}
	status.i = end;
}

function findRawTextEnd(source: string, tagName: string, start: number): number {
	// HTML's raw-text end state: any case of `</tagname` followed by
	// whitespace, `/` or `>` ends the element
	const pattern = new RegExp(`</${tagName}(?=[\\s/>])`, "gi");
	pattern.lastIndex = start;
	const match = pattern.exec(source);
	return match ? match.index : source.length;
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
