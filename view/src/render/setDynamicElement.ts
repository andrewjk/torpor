import context from "./context";

export default function setDynamicElement(el: Element, tag: string) {
	// If hydrating, it should already have been created as the correct element
	if (context.hydrationNode) {
		return el;
	}

	// Replace the old element with the new element
	// TODO: Should we copy attributes just in case they have been set manually?
	let newElement = document.createElement(tag);
	el.replaceWith(newElement);

	return newElement;
}
