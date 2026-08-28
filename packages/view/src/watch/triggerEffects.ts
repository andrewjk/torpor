import context from "../render/context";
import type Effect from "../types/Effect";
import type ProxySignal from "../types/ProxySignal";
import checkEffect from "./checkEffect";
import clearTargets from "./clearTargets";
import routeEffectError from "./routeEffectError";
import trackSignal from "./trackSignal";

/**
 * Re-subscribes a failed effect to the suspended computeds its run had read,
 * after `runEffect`'s catch detached them via `clearSources`. Called when no
 * error boundary handled the crash: the error still surfaces (see below),
 * but the promise's resolve re-runs the effect, so a crash caused by a
 * pending read's `undefined` heals instead of leaving a dead effect.
 */
function resubscribeSuspendSources(effect: Effect): void {
	const sources = effect.suspendSources;
	if (!sources || sources.size === 0) return;
	const oldActive = context.activeTarget;
	context.activeTarget = effect;
	for (const signal of sources) {
		trackSignal(signal);
	}
	context.activeTarget = oldActive;
}

/**
 * Runs the effects that have been collected during the batch.
 */
export default function triggerEffects(): void {
	//console.log(`triggering effects for '${String(key)}' on`, proxy);
	//console.log("===");
	//console.log(`triggering effects for '${String(key)}'`);

	// The first error that was NOT handled by an error boundary (if any).
	// Errors routed to a boundary are consumed by it; unhandled ones are
	// rethrown after the batch, as before boundaries existed.
	let unhandledError: { error: any } | null = null;

	// Run the queued effects. Appends made while running (by signal writes
	// within an effect) land in the same array and are picked up by the
	// index-based loop. An effect that already ran in this flush can be
	// re-queued the same way — `queued` is reset as each effect is
	// processed, so a later write re-runs it with fresh values.
	const queue = context.effectsToRun;
	for (let i = 0; i < queue.length; i++) {
		const effect = queue[i];
		context.batchOperation++;

		// Mark as not-queued BEFORE running, so that a signal write made
		// during this run — or during a later effect's run in the same
		// flush — can re-queue it if a source changed again
		effect.queued = false;

		try {
			checkEffect(effect);
		} catch (err) {
			// A re-run threw. Route it to the nearest enclosing error
			// boundary (@try/@catch or top-level @error), which re-renders
			// its catch branch; if there is none (or routing itself throws,
			// e.g. the catch content errors), record it to rethrow below
			let handled = false;
			try {
				handled = routeEffectError(effect, err);
			} catch (routingError) {
				if (unhandledError === null) {
					unhandledError = { error: routingError };
				}
			}
			if (!handled) {
				// No boundary took the error. If the failed run had read a
				// suspended $async getter, the crash may be caused by the
				// pending `undefined` it returned — keep the effect
				// subscribed so resolve re-runs it (self-heal) while the
				// error still surfaces below
				resubscribeSuspendSources(effect);
				if (unhandledError === null) {
					unhandledError = { error: err };
				}
			}
		}
	}

	// Clear the queue and reset the queued flag defensively (every processed
	// effect already reset its own, but an error may have skipped a run)
	for (let effect of queue) {
		effect.queued = false;
	}
	context.effectsToRun = [];

	// Clear unused target subscriptions for the signals that were updated
	// during the batch
	let signal: ProxySignal | null = context.firstSignalToUpdate;
	context.firstSignalToUpdate = null;
	context.lastSignalToUpdate = null;
	while (signal !== null) {
		clearTargets(signal);

		const nextSignal = signal.nextSignalToUpdate;
		signal.nextSignalToUpdate = null;
		signal = nextSignal;
	}

	if (unhandledError !== null) {
		throw unhandledError.error;
	}
}
