import devContext from "../dev/devContext";
import type Component from "../types/Component";
import type SlotRender from "../types/SlotRender";
import $run from "../watch/$run";
import context from "./context";
import newRange from "./newRange";
import pushRange from "./pushRange";

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
): void {
	// When mounting, the parent must have no child elements, so  we can just set
	// the hydration node to the first child node
	context.hydrationNode = parent.firstChild;

	// Create and push the root range
	// TODO: Does it need to be on context??
	context.rootRange = newRange(devContext.enabled ? "Root" : undefined);
	context.previousRange = context.rootRange;
	pushRange(context.rootRange);

	// Call the component's render function
	component(parent, null, props, undefined, slots);

	context.hydrationNode = null;

	// Now that we've hydrated, we can run $mount effects
	for (let effect of context.mountEffects) {
		$run(effect);
	}
	context.mountEffects.length = 0;
}
