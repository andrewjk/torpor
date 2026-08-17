import devContext from "../dev/devContext";
import context from "../render/context";
import type Cleanup from "../types/Cleanup";
import type Effect from "../types/Effect";
import { EFFECT_TYPE } from "../types/constants";
import runEffect from "./runEffect";

// TODO: Take a pipeline of operators e.g. debounce

/**
 * Runs and re-runs a function that depends on a watched object
 *
 * @param fn The function to run, which may return a cleanup function.
 * @param options Internal fields to set on the constructed Effect (e.g.
 *   `isMountEffect`, `forVarDeps`). Not part of the public API.
 */
export default function $run(
	fn: () => Cleanup | void,
	name?: string,
	options?: Pick<Effect, "isMountEffect" | "forVarMask">,
): Effect {
	let effect: Effect = {
		type: EFFECT_TYPE,
		run: fn,
		cleanup: undefined,
		firstSource: null,
		nextEffect: null,
		extent: 0,
		queued: false,
		didError: false,
		didSuspend: false,
		region: null,
		errorSources: null,
		name,
		isMountEffect: options?.isMountEffect,
		forVarMask: options?.forVarMask,
	};

	// Track the effect on the current active region, so it can be
	// cleaned up when the region is cleared
	const region = context.activeRegion;
	if (region !== null) {
		region.effects.push(effect);
		effect.region = region;
	}

	// DEV:
	devContext.onRun(effect);

	runEffect(effect);

	return effect;
}
