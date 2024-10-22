import type Component from "../types/Component";
import type SlotRender from "../types/SlotRender";
import context from "./context";

/**
 * Hydrates a component into an existing DOM tree
 * @param parent The parent node
 * @param component The component to mount
 * @param props An object containing component props
 */
export default function hydrate(
	parent: ParentNode,
	component: Component,
	props?: Record<string, any>,
	slots?: Record<string, SlotRender>,
) {
	// When mounting, the parent must have no child elements, so  we can just set
	// the hydration node to the first child node
	context.hydrationNode = parent.firstChild;

	// Call the component's render function
	component(parent, null, props, undefined, slots);

	context.hydrationNode = null;
}
