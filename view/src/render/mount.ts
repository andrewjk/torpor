import type Component from "../compile/types/Component";

/**
 * Mounts a component into the DOM
 * @param parent The parent node
 * @param component The component to mount
 * @param props An object containing component props
 */
export default function mount(
	parent: ParentNode,
	component: Component,
	props?: Record<string, any>,
) {
	// The parent must have no child elements, so that we can hydrate without
	// worrying about where to start
	if (parent.childElementCount) {
		throw new Error("The mounting parent node must have no child elements");
	}

	// Remove all text, commments, etc
	while (parent.firstChild) {
		parent.firstChild.remove();
	}

	// Call the component's render function
	component.render(parent, null, props);
}
