import hash from "../hash";
import type Attribute from "../types/styles/Attribute";
import type Style from "../types/styles/Style";
import type StyleBlock from "../types/styles/StyleBlock";
import type ParseStatus from "./ParseStatus";
import accept from "./utils/accept";
import consumeSpace from "./utils/consumeSpace";
import consumeUntil from "./utils/consumeUntil";
import isSpaceChar from "./utils/isSpaceChar";

export default function parseStyleElement(source: string, status: ParseStatus): Style {
	const style: Style = {
		global: false,
		blocks: [],
	};

	const styleStatus: ParseStatus = {
		name: "",
		source,
		i: 0,
		errors: [],
	};

	while (styleStatus.i < styleStatus.source.length) {
		if (isSpaceChar(styleStatus.source, styleStatus.i)) {
			consumeSpace(styleStatus);
		} else {
			const block = parseStyleBlock(styleStatus);
			style.blocks.push(block);
		}
	}

	status.styleHash = hash(source);
	status.errors = status.errors.concat(styleStatus.errors);

	return style;
}

function parseStyleBlock(status: ParseStatus): StyleBlock {
	const selector = consumeUntil("{", status).trim();
	accept("{", status);
	const block: StyleBlock = {
		selector,
		attributes: [],
		children: [],
	};
	consumeSpace(status);
	while (status.source[status.i] !== "}") {
		// HACK: Is it an attribute or a child block?
		let nextColon = status.source.indexOf(":", status.i);
		if (nextColon === -1) nextColon = status.source.length;
		let nextOpenBrace = status.source.indexOf("{", status.i);
		if (nextOpenBrace === -1) nextOpenBrace = status.source.length;
		if (nextColon < nextOpenBrace) {
			const attribute = parseStyleAttribute(status);
			block.attributes.push(attribute);
		} else if (nextOpenBrace < nextColon) {
			const child = parseStyleBlock(status);
			block.children.push(child);
		}
		consumeSpace(status);
	}
	accept("}", status);
	return block;
}

function parseStyleAttribute(status: ParseStatus): Attribute {
	const name = consumeUntil(":", status).trim();
	accept(":", status);
	const value = consumeUntil(";", status).trim();
	accept(";", status);
	return {
		name,
		value,
	};
}
