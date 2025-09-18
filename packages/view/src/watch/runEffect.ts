import context from "../render/context";
import type Effect from "../types/Effect";
import batchEnd from "./batchEnd";
import batchStart from "./batchStart";
import clearSources from "./clearSources";

export default function runEffect(effect: Effect): void {
	//console.log(`running effect '${effect.name}'`);

	// Store the active target
	const oldActiveTarget = context.activeTarget;
	const oldExtent = context.extent;

	effect.didError = false;

	batchStart();

	try {
		// Set the next effect for navigating through
		if (context.previousEffect !== null) {
			context.previousEffect.nextEffect = effect;
		}

		// Set the active effect, so that any properties accessed while running it
		// will trigger it in future
		context.activeTarget = effect;
		context.previousEffect = effect;
		context.extent = 1;

		// Run the effect to register its subscriptions and get its (optional)
		// cleanup function
		effect.cleanup = effect.run();

		effect.extent = context.extent;
	} catch (err) {
		effect.didError = true;
		clearSources(effect);
		throw err;
	} finally {
		// Set the active target back to what it was previously
		context.activeTarget = oldActiveTarget;
		context.extent += oldExtent;

		batchEnd();
	}
}
