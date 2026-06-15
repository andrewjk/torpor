import devContext from "../dev/devContext";
import context from "../render/context";
import type Effect from "../types/Effect";
import batchEnd from "./batchEnd";
import batchStart from "./batchStart";
import clearSources from "./clearSources";

export default function runEffect(effect: Effect): void {
	//console.log(`running effect '${effect.name}'`);

	// DEV:
	devContext.effectRun(effect);

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
		// Merge this effect's extent (including descendants) back into the
		// outer scope's extent. The outer scope's extent is oldExtent, and
		// context.extent currently holds this effect's extent (1 + descendants).
		// We add oldExtent to merge them, so that the parent effect's extent
		// (set to context.extent after we return) includes this effect and its
		// descendants.
		context.extent += oldExtent;

		batchEnd();
	}
}
