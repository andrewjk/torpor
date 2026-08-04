import type Region from "../types/Region";
import $run from "../watch/$run";
import animate from "./animate";
import context from "./context";
import isFragmentNode from "./isFragmentNode";

/**
 * Runs the mount-time side effects that both `addFragment` and `addElement`
 * share: `$mount` effects (only when not hydrating), stashed event listeners,
 * and stashed animations. No-op when `parent` is itself a `DocumentFragment`
 * (we're being inserted into a detached tree, so `$mount` and event hookup
 * would be premature — they'll run when the outer fragment attaches).
 *
 * Extracted so the `DocumentFragment` path (`addFragment`) and the
 * single-element path (`addElement`) don't duplicate this logic.
 */
export default function runMountSideEffects(
	parent: ParentNode,
	activeRegion: Region,
	hydrationNode: Node | null,
): void {
	if (isFragmentNode(parent)) return;

	// Only run $mount effects if not hydrating (if hydrating, they will get
	// run at the end when everything is hooked up)
	if (hydrationNode === null) {
		for (let effect of context.mountEffects) {
			$run(effect);
		}
		context.mountEffects.length = 0;
	}

	// Add event listeners directly to elements. These are not tied to
	// region lifecycle — when an element is removed from the DOM, its
	// listeners are garbage collected. This avoids a bug where event
	// listeners on sibling items were incorrectly cleaned up during
	// @for keyed list reconciliation.
	if (context.stashedEvents.length > 0) {
		for (let event of context.stashedEvents) {
			event.el.addEventListener(event.type, event.listener);
		}
		context.stashedEvents.length = 0;
	}

	// Set the active region for each animation so it will get attached to
	// the right one and set it back afterwards
	// Don't await animations
	for (let animation of context.stashedAnimations) {
		context.activeRegion = animation.region;
		$run(function runMountSideEffectsAnimation() {
			if (animation.in !== undefined) {
				// eslint-disable-next-line no-floating-promises
				animate(animation.el, true, animation.in.keyframes, animation.in.options);
			}
			if (animation.out !== undefined) {
				return () => {
					// eslint-disable-next-line no-floating-promises
					animate(animation.el, false, animation.out!.keyframes, animation.out!.options);
				};
			}
		});
	}
	context.stashedAnimations.length = 0;

	// Set the active region back
	context.activeRegion = activeRegion;
}
