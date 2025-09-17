import { type Computed } from "../types/Computed";
import { type Effect } from "../types/Effect";
import { type Subscription } from "../types/Subscription";

/**
 * Sets source subscriptions to inactive for a Computed or Effect.
 */
export default function deactivateSources(target: Computed | Effect): void {
	for (
		let sourceSub: Subscription | null = target.firstSource;
		sourceSub !== null;
		sourceSub = sourceSub.nextSource
	) {
		sourceSub.active = false;
		//console.log(
		//	`deactivating ${sourceSub.source.name} <-> ${sourceSub.target.name} (${sourceSub.name})`,
		//);
	}
}
