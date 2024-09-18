import type Cleanup from "../types/Cleanup";
import type Effect from "../types/Effect";
import context from "./context";

// TODO: Take a pipeline of operators e.g. debounce

/**
 * Runs and re-runs a function that depends on a watched object
 *
 * @param fn The function to run, which may return a cleanup function
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
