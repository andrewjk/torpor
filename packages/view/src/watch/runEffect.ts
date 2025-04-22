import context from "../render/context";
import { type Effect } from "../types/Effect";

export default function runEffect(effect: Effect): void {
	// Reactivate it in case it's been deactivated
	effect.active = true;

	// Set the active effect, so that any properties accessed while running it
	// will trigger it in future
	context.activeEffect = effect;

	// Run the effect to register its subscriptions and get its (optional)
	// cleanup function
	const cleanup = effect.run();

	if (typeof cleanup === "function") {
		effect.cleanup = cleanup;
	}

	context.activeEffect = null;
}
