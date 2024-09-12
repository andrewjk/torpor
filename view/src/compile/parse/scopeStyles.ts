import type TemplateNode from "../types/nodes/TemplateNode";
import isElementNode from "../types/nodes/isElementNode";
import isParentNode from "../types/nodes/isParentNode";
import type StyleBlock from "../types/styles/StyleBlock";
import { trimQuotes } from "../utils/trimQuotes";
import type ParseStatus from "./ParseStatus";

export default function scopeStyles(status: ParseStatus) {
	let selectors: string[] = [];
	if (status.style && status.styleHash && status.template) {
		for (let block of status.style.blocks) {
			collectStyleSelectors(block, selectors);
		}
		scopeStylesOnNode(status.template, selectors, status.styleHash);
	}
}

function scopeStylesOnNode(node: TemplateNode, selectors: string[], styleHash: string) {
	if (isElementNode(node)) {
		let addClass = selectors.includes(node.tagName);
		if (!addClass) {
			for (let a of node.attributes) {
				if (a.name === "class" || a.name.startsWith("class:")) {
					addClass = true;
				} else if (a.name === "id") {
					addClass = selectors.includes(`#${trimQuotes(a.value)}`);
				} else if (a.name === "class") {
					addClass = selectors.includes(`.${trimQuotes(a.value)}`);
				}
				if (addClass) break;
			}
		}
		if (addClass) {
			let classAttribute = node.attributes.find((a) => a.name === "class");
			if (classAttribute) {
				classAttribute.value = `"${trimQuotes(classAttribute.value)} tera-${styleHash}"`;
			} else {
				node.attributes.push({
					name: "class",
					value: `"tera-${styleHash}"`,
				});
			}
		}
	}

	if (isParentNode(node)) {
		for (let child of node.children) {
			scopeStylesOnNode(child, selectors, styleHash);
		}
	}
}

function collectStyleSelectors(block: StyleBlock, selectors: string[]) {
	// HACK: We should be collecting the actual selectors and then checking
	// attributes, parents, children, siblings etc
	for (let s of block.selector.split(/[\s*,>+~]/)) {
		selectors.push(s);
	}
}
