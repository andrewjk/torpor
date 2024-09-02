import context from "../global/context";
import type Cleanup from "../global/types/Cleanup";
import type Effect from "../global/types/Effect";

// TODO: Take a pipeline of operators e.g. debounce

/**
 * Runs and re-runs a function that depends on a watched object
 * @param fn The function to run
 */
export default function $run(fn: () => Cleanup | void) {
	let effect: Effect = {
		run: fn,
		cleanup: null,
	};

	context.activeEffect = effect;
	context.activeEffectSubbed = false;

	// Run the effect to register its subscriptions and get its (optional) cleanup function
	const cleanup = effect.run();

	if (typeof cleanup === "function") {
		// Add the cleanup function to the global context
		// TODO: Probably use a noop
		effect.cleanup = cleanup;

		// If there's an active DOM range, and no subscription was registered for this effect (i.e.
		// the effect doesn't depend on any watched properties), register the active effect with the
		// active range, so that it will be cleaned up when the range is removed
		if (context.activeRange && !context.activeEffectSubbed) {
			context.activeRange.emptyEffects ||= [];
			context.activeRange.emptyEffects.push(context.activeEffect);
		}
	}

	context.activeEffect = null;
}
