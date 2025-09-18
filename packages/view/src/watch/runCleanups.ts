import context from "../render/context";
import type Effect from "../types/Effect";
import clearSources from "./clearSources";

/**
 * Runs cleanup functions for the effect and its children.
 */
export default function runCleanups(effect: Effect): void {
	let effectToClean: Effect | null = effect;
	for (let i = 0; i < effect.extent; i++) {
		if (typeof effectToClean.cleanup === "function") {
			//console.log(`cleaning effect '${effectToClean.name}'`);
			const oldActiveTarget = context.activeTarget;
			context.activeTarget = null;

			try {
				effectToClean.cleanup();
			} catch (err) {
				effectToClean.didError = true;
				clearSources(effectToClean);
				throw err;
			} finally {
				effectToClean.cleanup = undefined;
				context.activeTarget = oldActiveTarget;
			}
		}

		const nextEffect: Effect = effectToClean.nextEffect!;

		// If it's a child effect that has been triggered, clean it up
		// and remove it from the list of effects to run (it may get
		// re-created with the parent)
		if (i !== 0 && effect.nextEffectToRun === effectToClean) {
			effect.nextEffectToRun = effectToClean.nextEffectToRun;
			effectToClean.nextEffect = effectToClean.nextEffectToRun = null;
		}

		effectToClean = nextEffect;
	}
}
