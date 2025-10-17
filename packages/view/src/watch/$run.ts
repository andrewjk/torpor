import type Cleanup from "../types/Cleanup";
import type Effect from "../types/Effect";
import { EFFECT_TYPE } from "../types/constants";
import runEffect from "./runEffect";

// TODO: Take a pipeline of operators e.g. debounce

/**
 * Runs and re-runs a function that depends on a watched object
 *
 * @param fn The function to run, which may return a cleanup function.
 */
export default function $run(fn: () => Cleanup | void, name?: string): Effect {
	let effect: Effect = {
		type: EFFECT_TYPE,
		run: fn,
		cleanup: undefined,
		firstSource: null,
		nextEffect: null,
		extent: 0,
		nextEffectToRun: null,
		didError: false,
		name,
	};

	runEffect(effect);

	return effect;
}
