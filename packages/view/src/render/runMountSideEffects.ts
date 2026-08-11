import type Region from "../types/Region";
import $run from "../watch/$run";
import animate from "./animate";
import context from "./context";
import { attachDelegatedEvent, isDelegatedEventType } from "./delegatedEvents";
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
			$run(effect, undefined, { isMountEffect: true });
		}
		context.mountEffects.length = 0;
	}

	// Attach event listeners. For bubbling event types (the majority —
	// `click`, `input`, `change`, `keydown`, …) we delegate: a single
	// listener per type lives on `document`, and each element's handler is
	// stored as a property. This avoids N `addEventListener` calls per N-row
	// list (js-framework-bench `runlots` goes from 20000 calls to 2) and the
	// matching browser-side `Listener` allocations. Non-bubbling types
	// (`focus`, `blur`, `scroll`, …) fall back to direct `addEventListener`
	// on the element. Listeners are not tied to region lifecycle — when an
	// element is removed from the DOM, its handler property is GC'd with it.
	if (context.stashedEvents.length > 0) {
		for (let event of context.stashedEvents) {
			if (isDelegatedEventType(event.type)) {
				attachDelegatedEvent(event.el, event.type, event.listener);
			} else {
				event.el.addEventListener(event.type, event.listener);
			}
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
