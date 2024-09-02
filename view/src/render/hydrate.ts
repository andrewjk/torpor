import type Component from "../compile/types/Component";
import context from "../global/context";

/**
 * Hydrates a component into an existing DOM tree
 * @param parent The parent node
 * @param component The component to mount
 * @param props An object containing component props
 */
export default function hydrate(parent: Node, component: Component, props?: Record<string, any>) {
	// When mounting, the parent must have no child elements, so  we can just set
	// the hydration node to the first child node
	context.hydrationNode = parent.firstChild;

	// Call the component's render function
	component.render(parent, null, props);

	context.hydrationNode = null;
}
