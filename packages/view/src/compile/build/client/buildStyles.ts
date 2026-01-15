import type AttributeNode from "../../types/styles/AttributeNode";
import type BlockNode from "../../types/styles/BlockNode";
import type Style from "../../types/styles/Style";
import type StyleNode from "../../types/styles/StyleNode";
import Builder from "../../utils/Builder";

export default function buildStyles(style: Style, styleHash: string): string {
	const b = new Builder();

	for (let block of style.children) {
		buildStyleNode(block, b, styleHash);
	}

	return b.toString();
}

function buildStyleNode(node: StyleNode, b: Builder, styleHash: string) {
	switch (node.type) {
		case "block": {
			buildBlockNode(node as BlockNode, b, styleHash);
			break;
		}
		case "attribute": {
			buildAttributeNode(node as AttributeNode, b);
			break;
		}
		case "comment": {
			// Don't include comments
			break;
		}
		default: {
			// eslint-disable-next-line restrict-template-expressions
			throw new Error(`Invalid style node type: ${node.type}`);
		}
	}
}

function buildBlockNode(block: BlockNode, b: Builder, styleHash: string) {
	// TODO: This should probably be done while parsing
	// And handle attribute selectors
	if (block.selector.startsWith("@")) {
		// Just output media queries and properties as-is
		b.append(`${block.selector} {`);
	} else {
		block.selector = block.selector.replaceAll(/\s+/g, " ");
		let selectors: string[] = [];
		let global = false;
		let start = 0;
		for (let i = 0; i <= block.selector.length; i++) {
			if (block.selector.substring(i).startsWith(":global(")) {
				i += ":global".length;
				start = i + 1;
				global = true;
			} else if (global && block.selector[i] === ")") {
				addSelector(selectors, block.selector, styleHash, start, i, global);
				start = i + 1;
				global = false;
			} else if ("*,>+~".includes(block.selector[i])) {
				addSelector(selectors, block.selector, styleHash, start, i, global);
				selectors.push(block.selector[i]);
				start = i + 1;
			} else if (i === block.selector.length) {
				addSelector(selectors, block.selector, styleHash, start, i, global);
			} else if (block.selector[i] === " ") {
				addSelector(selectors, block.selector, styleHash, start, i, global);
				start = i + 1;
			}
		}
		b.append(`${selectors.join(" ").replaceAll(" ,", ",")} {`);
	}
	for (let child of block.children) {
		buildStyleNode(child, b, styleHash);
	}
	b.append(`}`);
}

function addSelector(
	selectors: string[],
	selector: string,
	styleHash: string,
	start: number,
	end: number,
	global: boolean,
) {
	if (end > start) {
		let s = selector.substring(start, end);
		if (!global) {
			let pre = s;
			let post = "";
			// We might need to handle e.g. `:hover` or `::before`
			let colonPosition = s.indexOf(":");
			if (colonPosition !== -1) {
				pre = s.substring(0, colonPosition);
				post = s.substring(colonPosition);
			}
			s = `${pre}.torp-${styleHash}${post}`;
		}
		selectors.push(s);
	}
}

function buildAttributeNode(attribute: AttributeNode, b: Builder) {
	b.append(`${attribute.name}: ${attribute.value};`);
}
