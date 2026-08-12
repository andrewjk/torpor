import context from "../render/context";
import type Computed from "../types/Computed";
import { COMPUTED_TYPE } from "../types/constants";
import batchEnd from "./batchEnd";
import batchStart from "./batchStart";
import { propagateFromSignal } from "./propagateSignal";
import runComputed from "./runComputed";

/**
 * Caches an async computed value from a thunk that returns a Promise. A peer
 * of `$cache` for async getters: the returned Computed carries a `didSuspend`
 * indicator that the proxy get trap reads to suspend callers until the promise
 * resolves.
 *
 * The thenable check and `.then` wiring live inside `computed.run` (a closure
 * over the computed object), so they fire on both the initial run and every
 * recalculation — `runComputed` and `checkComputed` are unchanged.
 *
 * @param fn A thunk returning the Promise to await. Signal reads inside `fn`
 *   are tracked, so the fetch re-runs when dependencies change.
 */
export default function $await<T>(fn: () => Promise<T>): T {
	if (context.registerComputed === null) {
		throw new Error("$await must be used in a getter");
	}

	const computed: Computed = {
		type: COMPUTED_TYPE,
		value: null,
		run: null as unknown as () => any,
		firstSource: null,
		firstTarget: null,
		recalc: false,
		running: false,
		didError: false,
		didSuspend: false,
		generation: 0,
		rollback: null,
	};

	// The runner wraps the user's thunk: call fn(), and if the result is a
	// thenable, set didSuspend + wire the resolve/reject handlers. This runs
	// inside runComputed (with activeTarget set for dep tracking) on both the
	// initial call and every recalc, so stale resolves are handled by the
	// generation guard without any changes to runComputed or checkComputed.
	computed.run = () => {
		const value = fn();
		if (
			value !== null &&
			value !== undefined &&
			typeof (value as any).then === "function"
		) {
			const gen = ++computed.generation;
			computed.didSuspend = true;
			(value as Promise<T>).then(
				(v: T) => {
					if (computed.generation !== gen) return;
					computed.value = v;
					computed.didSuspend = false;
					batchStart();
					propagateFromSignal(computed);
					batchEnd();
				},
				(e: any) => {
					if (computed.generation !== gen) return;
					computed.value = e;
					computed.didError = true;
					computed.didSuspend = false;
					batchStart();
					propagateFromSignal(computed);
					batchEnd();
				},
			);
		}
		return value;
	};

	context.registerComputed(computed);

	runComputed(computed);

	return computed.value;
}
