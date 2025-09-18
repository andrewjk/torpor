import context from "../render/context";
import type Effect from "../types/Effect";
import type ProxySignal from "../types/ProxySignal";
import checkEffect from "./checkEffect";
import clearTargets from "./clearTargets";

/**
 * Runs the effects that have been collected during the batch.
 */
export default function triggerEffects(): void {
	//console.log(`triggering effects for '${String(key)}' on`, proxy);
	//console.log("===");
	//console.log(`triggering effects for '${String(key)}'`);

	let didError = false;
	let error: any;

	// Run the effects
	let effect: Effect | null = context.firstEffectToRun;
	while (effect !== null) {
		context.batchOperation++;

		try {
			checkEffect(effect);
		} catch (err) {
			if (!didError) {
				didError = true;
				error = err;
			}
		}

		effect = effect.nextEffectToRun;
	}

	// Clear the effects
	effect = context.firstEffectToRun;
	context.firstEffectToRun = null;
	while (effect !== null) {
		let nextEffect = effect.nextEffectToRun;
		effect.nextEffectToRun = null;
		effect = nextEffect;
	}

	// Clear unused target subscriptions for the signals that were updated
	// during the batch
	let signal: ProxySignal | null = context.firstSignalToUpdate;
	context.firstSignalToUpdate = null;
	while (signal !== null) {
		clearTargets(signal);

		const nextSignal = signal.nextSignalToUpdate;
		signal.nextSignalToUpdate = null;
		signal = nextSignal;
	}

	if (didError) {
		throw error;
	}
}
