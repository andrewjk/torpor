import type Component from "../compile/types/Component";
import type SlotRender from "../compile/types/SlotRender";
import context from "../global/context";

/**
 * Hydrates a component into an existing DOM tree
 * @param parent The parent node
 * @param component The component to mount
 * @param props An object containing component props
 */
export default function hydrateRoot(
	document: Document,
	component: Component,
	props?: Record<string, any>,
	slots?: Record<string, SlotRender>,
) {
	let html = document.documentElement;

	// With server side rendering, we start hydrating at the <html> element
	context.hydrationNode = html;

	// Call the component's render function
	component.render(html, null, props, slots);

	context.hydrationNode = null;
}
