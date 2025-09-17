import { type Computed } from "../types/Computed";
import { type Subscription } from "../types/Subscription";
import checkSources from "./checkSources";
import clearSources from "./clearSources";
import deactivateSources from "./deactivateSources";
import runComputed from "./runComputed";

/**
 * Checks whether a Computed value should be re-run (which will be true if any
 * of its sources have changed) and re-runs it if necessary.
 */
export default function checkComputed(computed: Computed): boolean {
	let rerun = checkSources(computed);

	let changed = false;

	if (rerun) {
		// Set source subscriptions to inactive
		deactivateSources(computed);

		// Run the computed, which will reset subscriptions
		const oldValue = computed.value;
		runComputed(computed);
		changed = computed.value !== oldValue;

		// Clear unused source subscriptions
		clearSources(computed);
	}

	computed.recalc = false;

	// If it hasn't changed, all of its target subscriptions remain active and
	// don't need to be recalculated
	if (!changed) {
		for (
			let targetSub: Subscription | null = computed.firstTarget;
			targetSub !== null;
			targetSub = targetSub.nextTarget
		) {
			targetSub.active = true;
			targetSub.recalc = false;
		}
	}

	return changed;
}
