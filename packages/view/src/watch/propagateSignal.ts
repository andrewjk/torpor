import context from "../render/context";
import type Computed from "../types/Computed";
import type ProxyData from "../types/ProxyData";
import type ProxySignal from "../types/ProxySignal";
import type Subscription from "../types/Subscription";
import { COMPUTED_TYPE, EFFECT_TYPE } from "../types/constants";
import batchEnd from "./batchEnd";
import batchStart from "./batchStart";

/**
 * Walk the target graph from a signal source (ProxySignal or Computed),
 * marking each dependent as needing recalculation and queuing effects for
 * re-run. Shared between `propagateSignal` (for proxy writes) and `$async`'s
 * promise-resolve handler (for async value resolution).
 *
 * Must be called inside `batchStart`/`batchEnd` — callers own the batch.
 */
export function propagateFromSignal(signal: { firstTarget: Subscription | null }): void {
	const first = signal.firstTarget;
	if (first === null) return;
	let targetSub: Subscription = first;

	let computed: Computed | undefined;
	outer: while (true) {
		// De-activate all targets, so they can be re-used/updated/deleted
		targetSub.active = false;
		targetSub.recalc = true;

		const target = targetSub.target;
		if (target.type === EFFECT_TYPE) {
			// Add the effect to the queue for running after triggering.
			// Dedupe on the `queued` flag — NOT on a link into the queue —
			// because link-based dedupe can't tell an effect still pending
			// in this flush from one that already ran earlier in this flush
			// but whose link hasn't been cleared yet. That gap silently
			// dropped re-queues for effects downstream of a computed whose
			// value oscillated within a single batch (e.g. a derived flag
			// during a props → state → props round-trip), freezing them at
			// a stale value.
			if (!target.queued) {
				target.queued = true;
				context.effectsToRun.push(target);
			}
		} else if (/*target.type === COMPUTED_TYPE*/ !target.recalc) {
			// This may need to be re-computed in the pull phase
			target.recalc = true;

			// Check the computed's targets
			if (target.firstTarget !== null) {
				computed = target;
				computed.rollback = targetSub;
				targetSub = target.firstTarget;
				continue;
			}
		}

		// If there are no more targets, we may need to rollback to the
		// last computed that had more targets
		while (targetSub.nextTarget === null && computed !== undefined) {
			const rollback = computed.rollback;
			if (rollback === null) break; // reached the root signal
			targetSub = rollback;
			if (targetSub.source.type !== COMPUTED_TYPE) {
				computed = undefined;
				continue outer;
			}
			computed = targetSub.source;
		}

		if (targetSub.nextTarget === null) {
			break;
		}

		targetSub = targetSub.nextTarget;
	}
}

/**
 * When a signal is changed, we need to
 * - Set the signal's subscriptions to recalc
 * - Set any dependent computed values to recalc
 * - Gather dependent effects that will need to be re-run
 */
export default function propagateSignal(proxy: ProxyData, key: PropertyKey): void {
	//console.log(`triggering effects for '${String(key)}' on`, proxy);
	//console.log("===");
	//console.log(`triggering effects for '${String(key)}'`);

	let signal = proxy.signals.get(key) as ProxySignal;
	if (signal !== undefined && signal.firstTarget !== null) {
		batchStart();

		try {
			// Add the signal to the context for updating after triggering.
			// Append via a tail pointer so this stays O(1), rather than walking
			// the whole chain on every write (which made batched mutations O(N²)).
			if (context.lastSignalToUpdate === null) {
				context.firstSignalToUpdate = signal;
				context.lastSignalToUpdate = signal;
			} else if (signal.nextSignalToUpdate === null) {
				context.lastSignalToUpdate.nextSignalToUpdate = signal;
				context.lastSignalToUpdate = signal;
			}

			propagateFromSignal(signal);
		} finally {
			batchEnd();
		}
	}
}
