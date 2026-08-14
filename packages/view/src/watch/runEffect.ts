import devContext from "../dev/devContext";
import context from "../render/context";
import type Computed from "../types/Computed";
import type Effect from "../types/Effect";
import type ProxySignal from "../types/ProxySignal";
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
	effect.errorSources = null;

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
		// Capture the source signals before clearing them, so an error
		// boundary can hold them for recovery (see routeEffectError) — the
		// effect's own subscriptions are about to be detached, and without
		// them the boundary would never re-attempt its try branch
		let sources: (ProxySignal | Computed)[] | null = null;
		for (let sub = effect.firstSource; sub !== null; sub = sub.nextSource) {
			(sources ??= []).push(sub.source);
		}
		effect.errorSources = sources;
		clearSources(effect);
		throw err;
	} finally {
		// Set the active target back to what it was previously
		context.activeTarget = oldActiveTarget;
		context.extent += oldExtent - 1;

		batchEnd();
	}
}
