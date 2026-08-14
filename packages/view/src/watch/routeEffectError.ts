import type Effect from "../types/Effect";
import type ErrorBoundary from "../types/ErrorBoundary";
import type Region from "../types/Region";
import type Computed from "../types/Computed";
import type ProxySignal from "../types/ProxySignal";
import type Subscription from "../types/Subscription";
import clearSources from "./clearSources";
import deactivateSources from "./deactivateSources";
import runCleanups from "./runCleanups";
import runEffect from "./runEffect";

/**
 * Routes an error thrown by an effect re-run to the nearest enclosing error
 * boundary (`@try`/`@catch` or top-level `@error`), and forces the boundary's
 * control effect to re-run so it renders its catch branch. Returns true if a
 * boundary handled the error.
 *
 * The boundary is found by walking the flattened region chain from the
 * effect's owning region (`Effect.region`, set by `$run`) through its
 * ancestors (regions with strictly decreasing depth on the `previousRegion`
 * chain — the same shape `clearRegion` walks).
 *
 * For recovery, the boundary holds the failing effect's source signals
 * (captured by `runEffect` before it cleared them, `Effect.errorSources`)
 * together with the boundary effect's own sources: reads wrapped in nested
 * `$run` effects (text/attribute interpolation) are tracked by those
 * effects, not the boundary, so without holding them the catch branch would
 * never re-attempt the try branch. `runTry` re-subscribes the boundary
 * effect to the held signals on every run that shows the catch branch.
 *
 * Called from `triggerEffects`' per-effect catch. If forcing the boundary
 * re-run itself throws (e.g. the catch branch content errors), the error
 * propagates to the caller, which reports it as unhandled — matching the
 * compiled form, where a throwing catch branch escapes the boundary.
 */
export default function routeEffectError(effect: Effect, error: any): boolean {
	let region: Region | null = effect.region ?? null;
	while (region !== null) {
		const boundary: ErrorBoundary | undefined = region.errorBoundary;
		if (boundary !== undefined && boundary.effect !== null) {
			const boundaryEffect = boundary.effect;

			// Hold the boundary effect's own sources plus the failing
			// effect's sources, so any of them changing re-attempts the try
			// branch (recovery)
			const held: (ProxySignal | Computed)[] = [];
			for (
				let sub: Subscription | null = boundaryEffect.firstSource;
				sub !== null;
				sub = sub.nextSource
			) {
				held.push(sub.source);
			}
			for (const signal of effect.errorSources ?? []) {
				if (!held.includes(signal)) {
					held.push(signal);
				}
			}
			boundary.error = error;
			boundary.hasError = true;
			boundary.heldSignals = held;

			// Force the boundary effect to re-run (unconditionally, like
			// `checkEffect` does when a source has changed). runTry renders
			// the catch branch with the routed error and holds the signals
			runCleanups(boundaryEffect);
			deactivateSources(boundaryEffect);
			runEffect(boundaryEffect);
			clearSources(boundaryEffect);

			return true;
		}

		// Walk to the nearest ancestor: the first previous region with
		// strictly smaller depth (siblings and children of siblings have
		// greater-or-equal depth and do not enclose this region)
		const depth = region.depth;
		let previous: Region | null = region.previousRegion;
		while (previous !== null && previous.depth >= depth) {
			previous = previous.previousRegion;
		}
		region = previous;
	}

	return false;
}
