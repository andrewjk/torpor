import context from "./context";

// TODO: Should we @toggle this instead? That would call onmount etc again for the new element

export default function setDynamicElement(el: HTMLElement, tag: string): HTMLElement {
	// If hydrating, it should already have been created as the correct element
	if (context.hydrationNode) {
		return el;
	}

	// Replace the old element with the new element
	let newElement = el.ownerDocument.createElement(tag);
	el.replaceWith(newElement);

	return newElement;
}
