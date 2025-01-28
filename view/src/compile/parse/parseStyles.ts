import { type Attribute } from "../types/styles/Attribute";
import { type StyleBlock } from "../types/styles/StyleBlock";
import hash from "../utils/hash";
import { type ParseStatus } from "./ParseStatus";
import accept from "./utils/accept";
import consumeSpace from "./utils/consumeSpace";
import consumeUntil from "./utils/consumeUntil";
import expect from "./utils/expect";
import isSpaceChar from "./utils/isSpaceChar";

export default function parseStyles(source: string, status: ParseStatus) {
	const current = status.components.at(-1);
	if (!current) return;

	current.style = {
		global: false,
		blocks: [],
		hash: hash(source),
	};

	const styleStatus: ParseStatus = {
		source,
		i: 0,
		marker: 0,
		level: 0,
		imports: [],
		script: "",
		components: [],
		errors: [],
	};

	while (styleStatus.i < styleStatus.source.length) {
		if (isSpaceChar(styleStatus.source, styleStatus.i)) {
			consumeSpace(styleStatus);
		} else {
			const block = parseStyleBlock(styleStatus);
			if (block) {
				current.style.blocks.push(block);
			} else {
				break;
			}
		}
	}

	status.errors = status.errors.concat(styleStatus.errors);
}

function parseStyleBlock(status: ParseStatus): StyleBlock | undefined {
	const selector = consumeUntil("{", status).trim();
	if (expect("{", status)) {
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
				if (child) {
					block.children.push(child);
				} else {
					break;
				}
			}
			consumeSpace(status);
		}
		accept("}", status);

		return block;
	}
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
