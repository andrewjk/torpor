import devContext from "../dev/devContext";
import context from "../render/context";
import type Cleanup from "../types/Cleanup";
import { EFFECT_TYPE } from "../types/constants";
import $peek from "./$peek";
import $run from "./$run";
import clearSources from "./clearSources";
import deactivateSources from "./deactivateSources";

/**
 * Runs the collected `$onmount`/`onmount` callbacks — once, after the
 * component's markup has been added to the DOM (or, when hydrating, after
 * hydration is complete). Multiple callbacks run in the order they were
 * added.
 *
 * Each callback becomes an effect with `isMountEffect` set, so the keyed-list
 * reconciler's force-rerun path (`rerunRegionEffects`) skips it. Its body
 * also runs untracked: mount callbacks are once-only, so reactive reads
 * inside them do not subscribe. In dev builds a tracked pass warns when a
 * callback reads reactive state, since that is almost always a mistake — the
 * reactive part should be wrapped in `$run`.
 */
export default function flushMountEffects(): void {
	if (context.mountEffects.length === 0) return;
	const activeRegion = context.activeRegion;
	for (let effect of context.mountEffects) {
		context.activeRegion = effect.region;
		$run(() => runMountCallback(effect.fn), undefined, { isMountEffect: true });
	}
	context.activeRegion = activeRegion;
	context.mountEffects.length = 0;
}

function runMountCallback(fn: () => Cleanup | void): Cleanup | void {
	if (!devContext.enabled) {
		// Mount callbacks run once — reads inside must not create subscriptions
		return $peek(fn);
	}

	// DEV: run tracked so stray reactive reads can be detected, then detach
	// the subscriptions so the effect still never re-runs
	const result = fn();

	const effect = context.activeTarget;
	if (effect !== null && effect.type === EFFECT_TYPE && effect.firstSource !== null) {
		console.warn(
			"[torpor] A $onmount/onmount callback read reactive state, but mount callbacks " +
				"run only once and will not re-run. Wrap the reactive part in $run(), " +
				"e.g. $onmount(() => { $run(() => ...); });",
		);
		deactivateSources(effect);
		clearSources(effect);
	}

	return result;
}
