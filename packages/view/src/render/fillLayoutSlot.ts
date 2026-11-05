import devContext from "../dev/devContext";
import type Component from "../types/Component";
import type Region from "../types/Region";
import type SlotRender from "../types/SlotRender";
import newRegion from "./newRegion";
import popRegion from "./popRegion";
import pushRegion from "./pushRegion";

// The depth of a layout-slot region that `clearLayoutSlot` removed, keyed by
// the DOM node the slot renders into, for the fill that replaces it. A refill
// runs outside any component render, where `context.activeRegion` is stale, so
// the depth can't be derived from it; reusing the cleared region's depth keeps
// the replacement ranked exactly where it was.
const refillDepths = new WeakMap<ParentNode, number>();

/**
 * Records the depth of a cleared layout-slot region for the fill that replaces
 * it (see `clearLayoutSlot`).
 *
 * @param parent The node the slot renders into
 * @param depth The cleared region's depth
 */
export function rememberSlotRefillDepth(parent: ParentNode, depth: number): void {
	refillDepths.set(parent, depth);
}

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

	// Rank the region as a child of the region the slot is rendered into:
	// `pushRegion` derived that from `activeRegion`, which is correct during a
	// render — the layout's region, or the branch region when the slot itself
	// is inside a control block. Do NOT derive it from `previousRegion`: the
	// chain tail can be a control branch that rendered before the slot, and
	// ranking the slot as that branch's descendant makes `clearRegion` release
	// the slot (tearing down the page's effects) when the branch is cleared.
	//
	// An imperative refill (after `clearLayoutSlot`) runs outside any render,
	// where `activeRegion` is stale; it reuses the cleared region's depth
	// instead (see `refillDepths`).
	const refillDepth = refillDepths.get(parent);
	if (refillDepth !== undefined) {
		region.depth = refillDepth;
		refillDepths.delete(parent);
	}

	component(parent, anchor, $props, $context, {
		_: slot,
	});

	popRegion(oldRegion);

	return region;
}
