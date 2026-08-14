import context from "../render/context";
import type Effect from "../types/Effect";
import type ProxySignal from "../types/ProxySignal";
import checkEffect from "./checkEffect";
import clearTargets from "./clearTargets";
import routeEffectError from "./routeEffectError";

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

	// Run the effects
	let effect: Effect | null = context.firstEffectToRun;
	while (effect !== null) {
		context.batchOperation++;

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
			if (!handled && unhandledError === null) {
				unhandledError = { error: err };
			}
		}

		effect = effect.nextEffectToRun;
	}

	// Clear the effects
	effect = context.firstEffectToRun;
	context.firstEffectToRun = null;
	context.lastEffectToRun = null;
	while (effect !== null) {
		let nextEffect = effect.nextEffectToRun;
		effect.nextEffectToRun = null;
		effect = nextEffect;
	}

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
