import type Component from "../types/Component";
import type SlotRender from "../types/SlotRender";
import context from "./context";
import newRange from "./newRange";
import pushRange from "./pushRange";

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
): void {
	// The parent node must have no child elements, so that we can hydrate
	// without worrying about where to start
	if (parent.childElementCount > 0) {
		throw new Error("The parent node must have no child elements");
	}

	// Remove all text, commments, etc
	while (parent.firstChild !== null) {
		parent.firstChild.remove();
	}

	// Create and push the root range
	context.rootRange = newRange();
	context.previousRange = context.rootRange;
	pushRange(context.rootRange);

	// Call the component's render function
	component(parent, null, props, undefined, slots);
}
