import { type Computed } from "../types/Computed";
import { type ProxySignal } from "../types/ProxySignal";
import { type Subscription } from "../types/Subscription";

/**
 * Clear unused target subscriptions after all Effects have been run.
 */
export default function clearTargets(source: ProxySignal | Computed): void {
	let previousSub: Subscription | null = null;
	for (
		let clearSub: Subscription | null = source.firstTarget;
		clearSub !== null;
		clearSub = clearSub.nextTarget
	) {
		if (!clearSub.active) {
			//console.log(
			//	`clearing target sub ${clearSub.source.name} <-> ${clearSub.target.name} (${clearSub.name})`,
			//);
			if (previousSub === null) {
				source.firstTarget = clearSub.nextTarget;
			} else {
				previousSub.nextTarget = clearSub.nextTarget;
			}
		} else {
			previousSub = clearSub;
		}
	}
}
