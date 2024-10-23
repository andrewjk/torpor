import type Template from "../../../types/Template";
import type Attribute from "../../types/nodes/Attribute";
import Style from "../../types/styles/Style";
import type StyleBlock from "../../types/styles/StyleBlock";
import Builder from "../../utils/Builder";

export default function buildStyles(style: Style, styleHash: string): string {
	const b = new Builder();

	for (let block of style.blocks) {
		buildStyleBlock(block, b, styleHash);
	}

	return b.toString();
}

const globalStyleRegex = /\:global\((.+)\)/;

function buildStyleBlock(block: StyleBlock, b: Builder, styleHash: string) {
	// TODO: This should probably be done while parsing
	// And handle attribute selectors
	const selectors = block.selector
		.split(/([\s*,>+~])/)
		.filter((s) => !!s.trim())
		.map((s) => {
			if (s.length === 1 && "*,>+~".includes(s)) {
				return s;
			} else if (globalStyleRegex.test(s)) {
				return s.match(globalStyleRegex)![1];
			} else {
				return `${s}.tera-${styleHash}`;
			}
		});

	b.append(`${selectors.join(" ")} {`);
	for (let attribute of block.attributes) {
		buildStyleAttribute(attribute, b);
	}
	for (let child of block.children) {
		buildStyleBlock(child, b, styleHash);
	}
	b.append(`}`);
}

function buildStyleAttribute(attribute: Attribute, b: Builder) {
	b.append(`${attribute.name}: ${attribute.value};`);
}
