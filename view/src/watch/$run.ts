import context from "../global/context";
import type Cleanup from "../global/types/Cleanup";
import Effect from "../global/types/Effect";

// TODO: Take a pipeline of operators e.g. debounce

/**
 * Runs and re-runs a function that depends on a watched object
 * @param fn The function to run
 */
export default function $run(fn: () => Cleanup | void) {
	let effect: Effect = {
		run: fn,
		cleanup: null,
		range: context.activeRange,
		props: null,
	};

	if (context.activeRange) {
		(context.activeRange.effects ??= []).push(effect);
	}

	context.activeEffect = effect;

	// Run the effect to register its subscriptions and get its (optional)
	// cleanup function
	const cleanup = effect.run();

	if (typeof cleanup === "function") {
		effect.cleanup = cleanup;
	}

	context.activeEffect = null;
}
