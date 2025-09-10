import { type Attribute } from "../../types/styles/Attribute";
import { type Style } from "../../types/styles/Style";
import { type StyleBlock } from "../../types/styles/StyleBlock";
import Builder from "../../utils/Builder";

export default function buildStyles(style: Style, styleHash: string): string {
	const b = new Builder();

	for (let block of style.blocks) {
		buildStyleBlock(block, b, styleHash);
	}

	return b.toString();
}

function buildStyleBlock(block: StyleBlock, b: Builder, styleHash: string) {
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
	for (let attribute of block.attributes) {
		buildStyleAttribute(attribute, b);
	}
	for (let child of block.children) {
		buildStyleBlock(child, b, styleHash);
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

function buildStyleAttribute(attribute: Attribute, b: Builder) {
	b.append(`${attribute.name}: ${attribute.value};`);
}
