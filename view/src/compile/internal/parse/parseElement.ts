import type ElementNode from "../../types/nodes/ElementNode";
import type TextNode from "../../types/nodes/TextNode";
import isSpecialNode from "../../types/nodes/isSpecialNode";
import isTextNode from "../../types/nodes/isTextNode";
import type ParseStatus from "./ParseStatus";
import addSpaceElement from "./addSpaceElement";
import parseControl from "./parseControl";
import parseTag from "./parseTag";
import { accept, isSpaceChar } from "./parseUtils";
import slottifyChildNodes from "./slottifyChildNodes";

// From https://developer.mozilla.org/en-US/docs/Glossary/Void_element
const voidTags = [
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
];

export default function parseElement(status: ParseStatus): ElementNode {
	const element = parseTag(status);

	if (!element.selfClosed && !voidTags.includes(element.tagName)) {
		// Get the children
		for (status.i; status.i < status.source.length; status.i++) {
			addSpaceElement(element, status);
			if (accept("</", status)) {
				// It's a closing element, so we're done here
				// TODO: Check that it's the correct closing element?
				status.i = status.source.indexOf(">", status.i + 1);
				break;
			} else if (accept("<!--", status)) {
				// It's a comment, swallow it
				status.i = status.source.indexOf("-->", status.i) + 3;
			} else if (accept("@//", status)) {
				// Swallow one-line comments
				status.i = status.source.indexOf("\n", status.i) + 1;
			} else if (accept("@/*", status)) {
				// Swallow multi-line comments
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
					status.i = end - 1;
				}
			}
		}
	}

	// If this is a component element, add a default <:fill> node
	if (
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

	if (isSpecialNode(element) && element.tagName === ":slot") {
		// If this is a <:slot> element, add a <:fill> node for its fallback
		// content. Anchors will be created for <:slot> nodes and fragments will
		// be created for the <:fill> content
		slottifyChildNodes(element);
	}

	return element;
}
