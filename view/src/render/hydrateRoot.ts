import type Component from "../types/Component";
import type SlotRender from "../types/SlotRender";
import context from "./context";

/**
 * Hydrates a component into an existing HTML document
 *
 * @param parent The parent node
 * @param component The component to mount
 * @param props An object containing component props
 *
 * @deprecated This was adapted from a React example, but it has problems with
 * browser plugins etc that add to or change the HTML that is served before it
 * is hydrated. I'm leaving it here in case it is useful in the future, but it
 * won't be exported and shouldn't be used
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
	component(html, null, props, slots);

	context.hydrationNode = null;
}
