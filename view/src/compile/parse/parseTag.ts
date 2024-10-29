import type Attribute from "../types/nodes/Attribute";
import type ElementNode from "../types/nodes/ElementNode";
import type ParseStatus from "./ParseStatus";
import parseInlineScript from "./parseInlineScript";
import accept from "./utils/accept";
import consumeAlphaNumeric from "./utils/consumeAlphaNumeric";
import consumeSpace from "./utils/consumeSpace";
import consumeUntil from "./utils/consumeUntil";

export default function parseTag(status: ParseStatus): ElementNode {
	accept("<", status);

	let closeTag = accept("/", status);

	consumeSpace(status);

	let special = accept(":", status);
	let tagName = consumeAlphaNumeric(status);
	if (special) {
		tagName = ":" + tagName;
	}
	if (closeTag) {
		tagName = "/" + tagName;
	}

	consumeSpace(status);

	let attributes = parseTagAttributes(status);

	let selfClosed = false;
	if (accept("/>", status)) {
		selfClosed = true;
		// Actually, it is kind of convenient to self-close things, and more consistent with
		// component tags...
		//if (!voidTags.includes(tagName)) {
		//	addError(status, `Self-closed non-void element: ${tagName}`, start);
		//}
	} else {
		accept(">", status);
	}

	if (closeTag) {
		selfClosed = true;
	}

	return {
		type: special ? "special" : "element",
		tagName,
		selfClosed: selfClosed || undefined,
		closed: selfClosed || undefined,
		attributes,
		children: [],
	};
}

function parseTagAttributes(status: ParseStatus): Attribute[] {
	let attributes: Attribute[] = [];
	while (status.i < status.source.length) {
		consumeSpace(status);
		if (accept("@//", status)) {
			// Swallow one-line comments
			status.i = status.source.indexOf("\n", status.i) + 1;
		} else if (accept("@/*", status)) {
			// Swallow block comments
			status.i = status.source.indexOf("*/", status.i) + 2;
		} else if (accept("/>", status, false) || accept(">", status, false)) {
			// That's the end of the attributes
			break;
		} else {
			const attribute = parseAttribute(status);
			attributes.push(attribute);
		}
	}
	return attributes;
}

function parseAttribute(status: ParseStatus): Attribute {
	let name = consumeUntil("= \t\r\n/>", status);
	let value: string | undefined = undefined;
	consumeSpace(status);
	if (accept("=", status)) {
		consumeSpace(status);
		value = parseAttributeValue(status);
	}
	return { name, value };
}

function parseAttributeValue(status: ParseStatus): string {
	if (accept('"', status)) {
		const value = consumeUntil('"', status);
		accept('"', status);
		return `"${value}"`;
	} else if (accept("'", status)) {
		const value = consumeUntil("'", status);
		accept("'", status);
		return `'${value}'`;
	} else if (accept("{", status)) {
		const value = parseInlineScript(status);
		return `{${value}}`;
	} else {
		let value = consumeUntil(" \t\r\n>", status);
		// Check whether we've landed at /> and if so, rewind
		if (status.source.substring(status.i - 1, status.i + 1) === "/>") {
			value = value.substring(0, value.length - 1);
			status.i -= 1;
		}
		return value;
	}
}
