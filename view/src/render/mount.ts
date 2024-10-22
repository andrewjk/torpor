import type Component from "../types/Component";
import type SlotRender from "../types/SlotRender";

/**
 * Mounts a component into a DOM node
 *
 * @param parent The node to mount the component into
 * @param component The component to mount
 * @param props An object containing component props
 */
export default function mount(
	parent: ParentNode,
	component: Component,
	props?: Record<string, any>,
	slots?: Record<string, SlotRender>,
) {
	// The parent node must have no child elements, so that we can hydrate
	// without worrying about where to start
	if (parent.childElementCount) {
		throw new Error("The parent node must have no child elements");
	}

	// Remove all text, commments, etc
	while (parent.firstChild) {
		parent.firstChild.remove();
	}

	// Call the component's render function
	component(parent, null, props, undefined, slots);
}
