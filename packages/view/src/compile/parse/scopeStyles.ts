import type TemplateNode from "../types/nodes/TemplateNode";
import isComponentNode from "../utils/isComponentNode";
import isElementNode from "../utils/isElementNode";
import isParentNode from "../utils/isParentNode";
import isSpecialNode from "../utils/isSpecialNode";
import type ParseStatus from "./ParseStatus";

/**
 * Marks every element in a component that has scoped styles with the
 * component's scope class. This is intentionally not selector-based: deciding
 * which elements a CSS selector can match requires parsing selectors, and
 * pseudo-classes, attribute selectors and `@media` rules make compile-time
 * matching unreliable. Marking every element lets `buildStyles` append the
 * scope class to selectors without needing to understand their shape.
 */
export default function scopeStyles(status: ParseStatus): void {
	for (let component of status.components) {
		if (!component.style) continue;
		if (component.markup) scopeStylesOnNode(component.markup);
		if (component.error) scopeStylesOnNode(component.error);
	}
}

function scopeStylesOnNode(node: TemplateNode) {
	if (
		isElementNode(node) ||
		isComponentNode(node) ||
		(isSpecialNode(node) && (node.tagName === "@element" || node.tagName === "@component"))
	) {
		node.scopeStyles = true;
	}

	if (isParentNode(node)) {
		for (let child of node.children) {
			scopeStylesOnNode(child);
		}
	}
}
