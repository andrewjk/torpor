// From https://stackoverflow.com/a/76535387
export default function getScrollParent(node: Element): Element {
	let currentParent = node.parentElement;
	while (currentParent) {
		if (isScrollable(currentParent)) {
			return currentParent;
		}
		currentParent = currentParent.parentElement;
	}
	return document.scrollingElement || document.documentElement;
}

function isScrollable(node: Element): boolean {
	if (!(node instanceof HTMLElement || node instanceof SVGElement)) {
		return false;
	}
	const style = getComputedStyle(node);
	return ["overflow", "overflow-x", "overflow-y"].some((propertyName) => {
		const value = style.getPropertyValue(propertyName);
		return value === "auto" || value === "scroll";
	});
}
