import { type TemplateNode } from "../types/nodes/TemplateNode";
import isComponentNode from "../types/nodes/isComponentNode";
import isElementNode from "../types/nodes/isElementNode";
import isParentNode from "../types/nodes/isParentNode";
import { type StyleBlock } from "../types/styles/StyleBlock";
import trimQuotes from "../utils/trimQuotes";
import { type ParseStatus } from "./ParseStatus";

export default function scopeStyles(status: ParseStatus): void {
	let selectors: string[] = [];
	for (let component of status.components) {
		if (component.style && component.markup) {
			for (let block of component.style.blocks) {
				collectStyleSelectors(block, selectors);
			}
			scopeStylesOnNode(component.markup, selectors);
		}
	}
}

function scopeStylesOnNode(node: TemplateNode, selectors: string[]) {
	if (isElementNode(node) || isComponentNode(node)) {
		let scopeStyles = selectors.includes(node.tagName);
		if (!scopeStyles) {
			for (let a of node.attributes) {
				if (a.name === "class" || a.name === ":class") {
					scopeStyles = true;
				} else if (a.name === "id" && a.value) {
					scopeStyles = selectors.includes(`#${trimQuotes(a.value)}`);
				} else if (a.name === "class" && a.value) {
					// TODO: Never getting here?
					scopeStyles = selectors.includes(`.${trimQuotes(a.value)}`);
				}
				if (scopeStyles) {
					break;
				}
			}
		}
		node.scopeStyles = scopeStyles;
	}

	if (isParentNode(node)) {
		for (let child of node.children) {
			scopeStylesOnNode(child, selectors);
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
