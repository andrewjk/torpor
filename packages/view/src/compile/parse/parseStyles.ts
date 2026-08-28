import type AttributeNode from "../types/styles/AttributeNode";
import type BlockNode from "../types/styles/BlockNode";
import CommentNode from "../types/styles/CommentNode";
import type StyleNode from "../types/styles/StyleNode";
import hash from "../utils/hash";
import type ParseStatus from "./ParseStatus";
import accept from "./utils/accept";
import consumeSpace from "./utils/consumeSpace";
import consumeUntil from "./utils/consumeUntil";
import expect from "./utils/expect";
import isSpaceChar from "./utils/isSpaceChar";

export default function parseStyles(source: string, status: ParseStatus): void {
	const current = status.components.at(-1);
	if (!current) return;

	current.style = {
		global: false,
		children: [],
		hash: hash(source),
	};

	const styleStatus: ParseStatus = {
		source,
		i: 0,
		marker: 0,
		level: 0,
		braces: [],
		imports: [],
		script: [],
		components: [],
		stack: [],
		errors: [],
	};

	while (styleStatus.i < styleStatus.source.length) {
		if (isSpaceChar(styleStatus.source, styleStatus.i)) {
			consumeSpace(styleStatus);
		} else {
			const node = parseStyleNode(styleStatus);
			if (node) {
				current.style.children.push(node);
			} else {
				break;
			}
		}
	}

	status.errors = status.errors.concat(styleStatus.errors);
}

function parseStyleNode(status: ParseStatus): StyleNode | undefined {
	const gapBefore = /\n\s*\n\s*$/.test(status.source.slice(0, status.i));

	if (accept("//", status, false) || accept("/*", status, false)) {
		return parseComment(status, gapBefore);
	}

	const selector = consumeUntil("{", status).trim();
	if (expect("{", status)) {
		const block: BlockNode = {
			type: "block",
			selector,
			children: [],
			gapBefore,
		};
		consumeSpace(status);
		while (status.source[status.i] !== "}") {
			if (accept("//", status, false) || accept("/*", status, false)) {
				// Comments are parsed but not emitted
				block.children.push(parseComment(status, false));
			} else {
				// HACK: Is it an attribute or a child block?
				let nextColon = status.source.indexOf(":", status.i);
				if (nextColon === -1) nextColon = status.source.length;
				let nextOpenBrace = status.source.indexOf("{", status.i);
				if (nextOpenBrace === -1) nextOpenBrace = status.source.length;
				if (nextColon < nextOpenBrace) {
					const attribute = parseStyleAttribute(status);
					block.children.push(attribute);
				} else if (nextOpenBrace < nextColon) {
					const child = parseStyleNode(status);
					if (child) {
						block.children.push(child);
					} else {
						break;
					}
				} else {
					return block;
				}
			}
			consumeSpace(status);
		}
		accept("}", status);

		return block;
	}
}

function parseComment(status: ParseStatus, gapBefore: boolean): CommentNode {
	const start = status.i;
	if (accept("//", status)) {
		const end = status.source.indexOf("\n", status.i);
		status.i = end === -1 ? status.source.length : end;
	} else {
		accept("/*", status);
		const end = status.source.indexOf("*/", status.i);
		status.i = end === -1 ? status.source.length : end + 2;
	}
	const comment: CommentNode = {
		type: "comment",
		content: status.source.substring(start, status.i),
		gapBefore,
	};
	return comment;
}

function parseStyleAttribute(status: ParseStatus): AttributeNode {
	const gapBefore = /\n\s*\n\s*$/.test(status.source.slice(0, status.i));
	const name = consumeUntil(":", status).trim();
	accept(":", status);
	const value = consumeUntil(";", status).trim();
	accept(";", status);
	return {
		type: "attribute",
		name,
		value,
		gapBefore,
	};
}
