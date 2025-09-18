import context from "../render/context";
import type Computed from "../types/Computed";
import type Effect from "../types/Effect";
import type Subscription from "../types/Subscription";
import { COMPUTED_TYPE, SIGNAL_TYPE } from "../types/constants";
import checkComputed from "./checkComputed";

// RECURSIVE

/**
 * Checks whether a Computed or Effect should be re-run (which will be true if
 * any of its sources have changed).
 */
export default function checkSources(target: Computed | Effect): boolean {
	// NOTE: We bail early if we know the target needs to be re-run; subsequent
	// computed values will be computed in the proxy getter

	// Check signals first as it's cheap, then computed values
	let haveComputed = false;

	for (
		let sourceSub: Subscription | null = target.firstSource;
		sourceSub !== null;
		sourceSub = sourceSub.nextSource
	) {
		//console.log(`checking source sub '${sourceSub.source.name}' (${sourceSub.name})`);
		if (sourceSub.recalc) {
			if (sourceSub.source.type === SIGNAL_TYPE) {
				return true;
			} /* else if (sourceSub.source.type === COMPUTED_TYPE) */ else {
				if (sourceSub.source.recalc) {
					haveComputed = true;
				} else {
					return true;
				}
			}
		}
	}

	if (haveComputed) {
		for (
			let sourceSub: Subscription | null = target.firstSource;
			sourceSub !== null;
			sourceSub = sourceSub.nextSource
		) {
			//console.log(`checking source sub '${sourceSub.source.name}' (${sourceSub.name})`);
			if (sourceSub.recalc && sourceSub.source.type === COMPUTED_TYPE && sourceSub.source.recalc) {
				const oldActiveTarget = context.activeTarget;
				context.activeTarget = target;

				const recalc = checkComputed(sourceSub.source);

				context.activeTarget = oldActiveTarget;

				if (recalc) {
					return true;
				}
			}
		}
	}

	return false;
}
