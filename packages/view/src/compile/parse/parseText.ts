import type SourceSpan from "../types/SourceSpan";
import type ElementNode from "../types/nodes/ElementNode";
import type TextNode from "../types/nodes/TextNode";
import endOfString from "../utils/endOfString";
import endOfTemplateString from "../utils/endOfTemplateString";
import isTextNode from "../utils/isTextNode";
import type ParseStatus from "./ParseStatus";
import isSpaceChar from "./utils/isSpaceChar";

export default function parseText(status: ParseStatus, element: ElementNode): void {
	// Add a range for each reactive part of the text so that we can map them
	// back when building
	let spans: SourceSpan[] = [];

	// Text ends at the next element, or at the next control statement, or at
	// the end of the render
	// But only if the control statement is after a newline, so we don't mess
	// with emails etc. This may need more finessing
	const start = status.i;
	let end = -1;
	for (let j = status.i; j < status.source.length; j++) {
		if (status.source[j] === "}") {
			// That's the rendering done
			end = j;
		} else if (status.source[j] === "{") {
			// Skip reactive content
			const reactiveStart = j + 1;
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
			// Add the source range
			spans.push({ start: reactiveStart, end: j });
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
				previousNode.spans.push(...spans);
				//previousNode.range.endIndex += content.length + spaceContent.length;
				// TODO: end char etc
			} else {
				const text: TextNode = {
					type: "text",
					content: content + spaceContent,
					spans,
				};
				element.children.push(text);
			}
		}
		status.i = end;
	} else {
		status.i += 1;
	}
}
