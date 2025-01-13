import type Cleanup from "../types/Cleanup";
import type Effect from "../types/Effect";
import runEffect from "../watch/runEffect";
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
		props: null,
		active: true,
	};

	if (context.activeRange) {
		//console.log("the range is ", context.activeRange.id);
		(context.activeRange.effects ??= []).push(effect);
	}

	runEffect(effect);
}
