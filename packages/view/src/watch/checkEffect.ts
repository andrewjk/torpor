import type Effect from "../types/Effect";
import checkSources from "./checkSources";
import clearSources from "./clearSources";
import deactivateSources from "./deactivateSources";
import runCleanups from "./runCleanups";
import runEffect from "./runEffect";

/**
 * Checks whether an Effect should be re-run (which will be true if any
 * of its sources have changed) and re-runs it if necessary.
 */
export default function checkEffect(effect: Effect): void {
	//console.log(`checking effect '${effect.name}'`);

	let rerun = checkSources(effect);

	if (rerun) {
		// Run cleanup functions for the effect and its children
		runCleanups(effect);

		// Set source subscriptions to inactive
		deactivateSources(effect);

		// Run the effect, which will reset subscriptions
		runEffect(effect);

		// Clear unused source subscriptions
		clearSources(effect);
	}
}
