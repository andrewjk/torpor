import type ComponentTemplate from "../../../types/ComponentTemplate";
import Builder from "../../Builder";
import type Attribute from "../../types/nodes/Attribute";
import type StyleBlock from "../../types/styles/StyleBlock";

export default function buildStyles(name: string, template: ComponentTemplate): string {
	const b = new Builder();

	if (template.style && template.styleHash) {
		for (let block of template.style.blocks) {
			buildStyleBlock(block, b, template.styleHash);
		}

		if (template.childComponents) {
			for (let child of template.childComponents) {
				if (child.style && child.styleHash) {
					for (let block of child.style.blocks) {
						buildStyleBlock(block, b, child.styleHash);
					}
				}
			}
		}
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
