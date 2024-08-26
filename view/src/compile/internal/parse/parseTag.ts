import Attribute from "../../types/nodes/Attribute";
import ElementNode from "../../types/nodes/ElementNode";
import ParseStatus from "./ParseStatus";
import { accept, consumeSpace, consumeUntil, consumeWord, isSpaceChar } from "./parseUtils";

export default function parseTag(status: ParseStatus): ElementNode {
	accept("<", status);

	consumeSpace(status);
	let special = accept(":", status);
	let tagName = consumeWord(status);
	consumeSpace(status);

	const element: ElementNode = {
		type: "element",
		tagName,
		attributes: [],
		children: [],
	};

	if (special) {
		element.type = "special";
		element.tagName = ":" + element.tagName;
	}

	if (accept(">", status)) {
		// Don't need to do anything
	} else if (accept("/>", status)) {
		element.selfClosed = true;
	} else {
		parseTagAttributes(element, status);
	}

	return element;
}

function parseTagAttributes(element: ElementNode, status: ParseStatus) {
	for (status.i; status.i < status.source.length; status.i++) {
		const char = status.source[status.i];
		if (char === "/") {
			element.selfClosed = true;
			status.i += 2;
			return;
		} else if (char === ">") {
			status.i += 1;
			return;
		} else if (!isSpaceChar(status.source, status.i)) {
			const attribute = parseAttribute(status);
			element.attributes.push(attribute);
		}
	}
}

function parseAttribute(status: ParseStatus): Attribute {
	let name = consumeUntil("= \t\r\n/>", status);
	const attribute: Attribute = {
		name,
		value: "",
	};
	consumeSpace(status);
	if (accept("=", status)) {
		consumeSpace(status);
		attribute.value = parseAttributeValue(status);
	}
	// HACK: Really have to sort out this parsing stuff
	const char = status.source[status.i];
	if (char === "/" || char === ">" || char === "{") {
		status.i -= 1;
	}
	return attribute;
}

function parseAttributeValue(status: ParseStatus): string {
	const start = status.i;
	const startChar = status.source[status.i];
	let braceCount = 0;
	status.i++;
	for (status.i; status.i < status.source.length; status.i++) {
		const char = status.source[status.i];
		if (startChar === '"' || startChar === "'") {
			if (char === startChar) {
				//status.i++;
				return status.source.substring(start, status.i + 1);
			}
		} else if (startChar === "{") {
			if (char === "{") {
				braceCount += 1;
			} else if (char === "}") {
				if (braceCount === 0) {
					//status.i++;
					return status.source.substring(start, status.i + 1);
				} else {
					braceCount -= 1;
				}
			} else if (char === '"' || char === "'" || char === "`") {
				// Ignore the content of strings
				status.i += 1;
				for (status.i; status.i < status.source.length; status.i++) {
					if (status.source[status.i] === char && status.source[status.i - 1] !== "\\") {
						break;
					}
				}
			} else if (char === "/") {
				const nextChar = status.source[status.i + 1];
				if (nextChar === "/") {
					// Ignore the content of one-line comments
					status.i += 2;
					for (status.i; status.i < status.source.length; status.i++) {
						if (status.source[status.i] === "\n") {
							break;
						}
					}
				} else if (nextChar === "*") {
					// Ignore the content of multiple-line comments
					status.i += 2;
					for (status.i; status.i < status.source.length; status.i++) {
						if (status.source[status.i] === "/" && status.source[status.i - 1] === "*") {
							break;
						}
					}
				} else if (nextChar === ">") {
					// HACK: Go back to the start of the slash so that it gets parsed in parseTagAttributes
					status.i -= 1;
					return status.source.substring(start, status.i);
				}
			}
		} else {
			if (char === ">" || isSpaceChar(status.source, status.i)) {
				// HACK: Go back to the start of the > so that it gets parsed in parseTagAttributes
				status.i -= 1;
				return status.source.substring(start, status.i + 1);
			}
		}
	}

	return "";
}
