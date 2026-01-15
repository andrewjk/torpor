import type Attribute from "../types/nodes/Attribute";
import type ElementNode from "../types/nodes/ElementNode";
import isFullyReactive from "../utils/isFullyReactive";
import isReactive from "../utils/isReactive";
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

	let tagStart = status.i + 1;
	let snailed = accept("@", status);
	let tagName = consumeAlphaNumeric(status);
	let tagEnd = status.i;

	if (snailed) {
		tagName = "@" + tagName;
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

	let special = ["slot", "fill", "filldef", "@component", "@element"].includes(tagName);

	return {
		type: special ? "special" : "element",
		tagName,
		selfClosed: selfClosed || undefined,
		closed: selfClosed || undefined,
		attributes,
		children: [],
		span: { start: tagStart, end: tagEnd },
	} satisfies ElementNode;
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
		} else if (
			accept("<", status, false) ||
			accept("@", status, false) ||
			accept("}", status, false)
		) {
			// It's an unclosed tag -- just bail out here
			break;
		} else {
			const attribute = parseAttribute(status);
			attributes.push(attribute);
		}
	}
	return attributes;
}

function parseAttribute(status: ParseStatus): Attribute {
	let valueStart = status.i;
	let valueEnd = status.i;
	let name = consumeUntil("= \t\r\n/>", status);
	let value: string | undefined = undefined;
	let reactive = false;
	let fullyReactive = false;
	consumeSpace(status);
	if (accept("=", status)) {
		consumeSpace(status);
		valueStart = status.i;
		value = parseAttributeValue(status);
		valueEnd = status.i;
		reactive = isReactive(value);
		fullyReactive = isFullyReactive(value);
		if (fullyReactive) {
			value = value.substring(1, value.length - 1);
			valueStart++;
			valueEnd--;
		}
	} else if (name.startsWith("{") && name.endsWith("}")) {
		value = name.substring(1, name.length - 1);
		valueStart++;
		valueEnd = valueStart + name.length;
		if (value.startsWith("...")) {
			// It's a spread attribute, just set the name to the value
			name = value;
		} else {
			// It's a shortcut attribute. It could be e.g. {width} or it could be
			// {$state.width}, but in either case we set the value of the width
			// property
			name = value.split(".").at(-1)!;
		}
		// Handle definite assignment assertions e.g. {$state.width!}
		if (name.endsWith("!")) {
			name = name.substring(0, name.length - 1);
		}
		reactive = fullyReactive = true;
	}
	return {
		name,
		value,
		reactive,
		fullyReactive,
		span: { start: valueStart, end: valueEnd },
	};
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
