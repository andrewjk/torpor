import type Computed from "../types/Computed";
import type Effect from "../types/Effect";
import type Subscription from "../types/Subscription";

/**
 * Clear unused source subscriptions after each Computed or Effect has been run.
 */
export default function clearSources(target: Computed | Effect): void {
	let previousSub: Subscription | null = null;
	for (
		let clearSub: Subscription | null = target.firstSource;
		clearSub !== null;
		clearSub = clearSub.nextSource
	) {
		if (target.didError || !clearSub.active) {
			//console.log(
			//	`clearing source sub ${clearSub.source.name} <-> ${clearSub.target.name} (${clearSub.name})`,
			//);
			if (previousSub === null) {
				target.firstSource = clearSub.nextSource;
			} else {
				previousSub.nextSource = clearSub.nextSource;
			}

			// Update the targets list too
			if (clearSub.previousTarget === null) {
				if (clearSub.source.firstTarget === clearSub) {
					clearSub.source.firstTarget = clearSub.nextTarget;
				}
				// TODO: else???
			} else {
				clearSub.previousTarget.nextTarget = clearSub.nextTarget;
			}
		} else {
			clearSub.recalc = false;
			previousSub = clearSub;
		}
	}
}
