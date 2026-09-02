import devContext from "../dev/devContext";
import type Component from "../types/Component";
import type Region from "../types/Region";
import type SlotRender from "../types/SlotRender";
import newRegion from "./newRegion";
import popRegion from "./popRegion";
import pushRegion from "./pushRegion";

/**
 * Renders a component into a persistent layout slot, and returns the region
 * it was rendered into. Used by the layout engine during navigation: the
 * component is created inside `parent` at `anchor`, with `slot` as its child
 * slot render, and the returned region can later be passed to
 * `clearLayoutSlot` to tear the page down — leaving the layout itself
 * intact — before refilling the slot.
 *
 * @param component The component to render into the slot
 * @param slot The slot render to pass to the component
 * @param parent The parent node to render into
 * @param anchor The node to insert content before, or null to append
 * @param $props Optional props to pass to the component
 * @param $context Optional context to pass to the component
 */
export default function fillLayoutSlot(
	component: Component,
	slot: SlotRender,
	parent: ParentNode,
	anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
): Region {
	const region = newRegion(devContext.enabled ? "Layout slot" : undefined);
	const oldRegion = pushRegion(region, true);

	component(parent, anchor, $props, $context, {
		_: slot,
	});

	popRegion(oldRegion);

	return region;
}
