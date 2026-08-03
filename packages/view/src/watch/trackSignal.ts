import context from "../render/context";
import type Computed from "../types/Computed";
import type ProxySignal from "../types/ProxySignal";
import type Subscription from "../types/Subscription";

/**
 * If there's an active target, subscribe it to this signal, so that it will be
 * run when the signal changes.
 */
export default function trackSignal(signal: ProxySignal | Computed): void {
	const target = context.activeTarget;
	if (target !== null) {
		// Walk the target's existing sources (typically a handful) to look for
		// an existing subscription we can re-use, instead of walking the
		// signal's target list. A popular signal (e.g. a parent's `selected`
		// flag fanned out to thousands of list-item effects) can have a very
		// long target list, which made subscription O(N) per call and O(N²)
		// total — the dominant cost in the js-framework-bench `runlots` op.
		// The target's source list is bounded by the number of distinct
		// signals this single effect depends on (almost always <10).
		for (
			let existingSub: Subscription | null = target.firstSource;
			existingSub !== null;
			existingSub = existingSub.nextSource
		) {
			if (existingSub.source === signal) {
				// Re-use the existing subscription
				existingSub.active = true;
				return;
			}
		}

		// No existing subscription — create a new one. Prepend to both lists
		// to keep this O(1); the order of subscriptions within a signal's
		// target list has no semantic meaning (effect run order is decided by
		// dependency graph, not subscription order).
		const oldFirstTarget = signal.firstTarget;
		const sub: Subscription = {
			source: signal,
			target: target,
			previousTarget: null,
			nextTarget: oldFirstTarget,
			nextSource: target.firstSource,
			active: true,
			recalc: false,
		};
		if (oldFirstTarget !== null) {
			oldFirstTarget.previousTarget = sub;
		}
		signal.firstTarget = sub;
		target.firstSource = sub;
	}
}
