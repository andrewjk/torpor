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

	consumeSpace(status);

	let special = accept(":", status);
	let tagName = consumeAlphaNumeric(status);
	if (special) {
		tagName = ":" + tagName;
	}

	consumeSpace(status);

	let attributes = parseTagAttributes(status);

	let selfClosed = false;
	if (accept("/>", status)) {
		selfClosed = true;
	} else {
		accept(">", status);
	}

	return {
		type: special ? "special" : "element",
		tagName,
		selfClosed: selfClosed || undefined,
		attributes,
		children: [],
	};
}

function parseTagAttributes(status: ParseStatus): Attribute[] {
	let attributes: Attribute[] = [];
	while (status.i < status.source.length) {
		consumeSpace(status);
		if (accept("/>", status, false) || accept(">", status, false)) {
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
	let value = "";
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

	return "";
}
