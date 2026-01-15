import type TemplateNode from "../types/nodes/TemplateNode";
import type BlockNode from "../types/styles/BlockNode";
import isComponentNode from "../utils/isComponentNode";
import isElementNode from "../utils/isElementNode";
import isParentNode from "../utils/isParentNode";
import trimQuotes from "../utils/trimQuotes";
import type ParseStatus from "./ParseStatus";

export default function scopeStyles(status: ParseStatus): void {
	let selectors: string[] = [];
	for (let component of status.components) {
		if (component.style && component.markup) {
			for (let block of component.style.children) {
				if (block.type === "block") {
					collectStyleSelectors(block as BlockNode, selectors);
				}
			}
			scopeStylesOnNode(component.markup, selectors);
		}
	}
}

function scopeStylesOnNode(node: TemplateNode, selectors: string[]) {
	if (isElementNode(node) || isComponentNode(node)) {
		node.scopeStyles =
			selectors.includes(node.tagName) ||
			node.attributes.find((a) => {
				if (a.name === "class" && a.reactive) {
					// Any reactivity in a class attribute makes it scoped,
					// because we can't tell what's going on in there
					return true;
				} else if (a.name === "id" && a.value) {
					if (selectors.includes(`#${trimQuotes(a.value)}`)) {
						return true;
					}
				} else if (a.name === "class" && a.value) {
					for (let classname of trimQuotes(a.value).split(/\s+/)) {
						if (selectors.includes(`.${classname}`)) {
							return true;
						}
					}
				}
			}) !== undefined;
	}

	if (isParentNode(node)) {
		for (let child of node.children) {
			scopeStylesOnNode(child, selectors);
		}
	}
}

function collectStyleSelectors(block: BlockNode, selectors: string[]) {
	// HACK: We should be collecting the actual selectors and then checking
	// attributes, parents, children, siblings etc
	for (let s of block.selector.split(/[\s*,>+~[\]]/)) {
		selectors.push(s);
	}
}
