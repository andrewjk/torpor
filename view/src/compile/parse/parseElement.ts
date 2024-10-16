import type ControlNode from "../types/nodes/ControlNode";
import type ElementNode from "../types/nodes/ElementNode";
import type TextNode from "../types/nodes/TextNode";
import isSpecialNode from "../types/nodes/isSpecialNode";
import isTextNode from "../types/nodes/isTextNode";
import trimMatched from "../utils/trimMatched";
import voidTags from "../utils/voidTags";
import type ParseStatus from "./ParseStatus";
import addSpaceElement from "./addSpaceElement";
import parseControl from "./parseControl";
import parseTag from "./parseTag";
import slottifyChildNodes from "./slottifyChildNodes";
import accept from "./utils/accept";
import addError from "./utils/addError";
import isSpaceChar from "./utils/isSpaceChar";

export default function parseElement(status: ParseStatus): ElementNode {
	const start = status.i;

	const element = parseTag(status);

	// TODO: Should we add children of void tags so that we can show an error to the user about it?

	if (!element.selfClosed && !voidTags.includes(element.tagName)) {
		// Get the children
		while (status.i < status.source.length) {
			addSpaceElement(element, status);
			if (accept("</", status)) {
				// It's a closing element, so we're done here
				status.i = status.source.indexOf(">", status.i + 1) + 1;
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
			} else if (accept("<", status, false)) {
				// It's a child element
				const child = parseElement(status);
				element.children.push(child);
			} else if (accept("@", status, false)) {
				// It's a control statement
				parseControl(status, element);
			} else {
				// It's text content
				const start = status.i;
				// It ends at the next element, or at the next control statement
				// But only if the control statement is after a newline, so we don't
				// mess with emails etc. This may need more finessing
				let end = -1;
				for (let j = status.i + 1; j < status.source.length; j++) {
					if (status.source[j] === "<") {
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
					// Rewind to the < so that it will get checked in the next loop, above
					status.i = end; // - 1;
				} else {
					status.i += 1;
				}
			}
		}
	}

	// If this is a component element, add a default <:fill> node
	if (
		element.tagName === status.name ||
		status.imports?.some((i) => i.name === element.tagName) ||
		status.childTemplates?.some((c) => c.name === element.tagName)
	) {
		element.type = "component";
		slottifyChildNodes(element);
	}

	// Not sure about this one:
	//// If there's a src attribute, convert the element to an imported component
	//for (let i = 0; i < element.attributes.length; i++) {
	//	if (element.attributes[i].name === "src") {
	//		element.type = "component";
	//		slottifyChildNodes(element);
	//
	//		status.imports ||= [];
	//		status.imports.push({
	//			name: element.tagName,
	//			path: trimQuotes(element.attributes[i].value),
	//			nonDefault: false,
	//		});
	//
	//		element.attributes.splice(i, 1);
	//		break;
	//	}
	//}

	if (isSpecialNode(element)) {
		if (element.tagName === ":slot") {
			// If this is a <:slot> element, add a <:fill> node for its fallback
			// content. Anchors will be created for <:slot> nodes and fragments will
			// be created for the <:fill> content
			slottifyChildNodes(element);
		} else if (element.tagName === ":self") {
			element.tagName = status.name;
			element.type = "component";
			slottifyChildNodes(element);
		} else if (element.tagName === ":component") {
			const selfAttribute = element.attributes.find((a) => a.name === "self");
			if (selfAttribute && selfAttribute.value) {
				element.type = "component";
				slottifyChildNodes(element);

				const selfValue = trimMatched(selfAttribute.value, "{", "}");
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
				addError(status, ":component element must have a self attribute", start);
			}
		}
	}

	return element;
}
