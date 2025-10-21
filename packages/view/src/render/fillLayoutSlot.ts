import devContext from "../dev/devContext";
import type Component from "../types/Component";
import type Region from "../types/Region";
import type SlotRender from "../types/SlotRender";
import newRegion from "./newRegion";
import popRegion from "./popRegion";
import pushRegion from "./pushRegion";

export default function fillLayoutSlot(
	component: Component,
	slot: SlotRender,
	parent: ParentNode,
	anchor: Node | null,
	$props: Record<string, string>,
	$context?: Record<PropertyKey, any>,
): Region {
	const region = newRegion(devContext.enabled ? component.name : undefined);
	const oldRegion = pushRegion(region, true);

	component(parent, anchor, $props, $context, {
		_: slot,
	});

	popRegion(oldRegion);

	return region;
}
