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
		isAwait: true,
		value: null,
		run: null as unknown as () => any,
		firstSource: null,
		firstTarget: null,
		recalc: false,
		running: false,
		didError: false,
		didSuspend: false,
		generation: 0,
		hasResolved: false,
		lastErrored: false,
		suspendQuiet: false,
		staleValue: undefined,
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
			// Stash the previously resolved value before runComputed overwrites
			// `value` with this new promise. suspendRead returns it to readers
			// during the refresh so an `@loading` boundary keeps displaying the
			// old content instead of flashing fallback — stale-while-revalidate
			// (ASYNC.md §6.2). Inside run(), computed.value still holds the
			// previous run's result; undefined on a first load (hasResolved).
			// A rejected result (lastErrored) is never retained — a retry
			// suspend must not hand the previous error to readers as content.
			computed.staleValue =
				computed.hasResolved && !computed.lastErrored ? computed.value : undefined;
			// Capture the quiet-on-refresh decision at suspend time
			// (ASYNC.md §7.4). `recalc` is still true during a source-driven
			// re-run — `checkComputed` clears it only after `runComputed`
			// returns — so a suspend is quiet iff the computed has resolved
			// before AND this run wasn't triggered by a dependency change
			// (i.e. a silent `$refresh(fn, { silent: true })`).
			// First loads are loud (`hasResolved` is false); dep-change
			// refreshes and loud `$refresh` calls are loud (`recalc` is true).
			computed.suspendQuiet = computed.hasResolved && !computed.recalc;
			(value as Promise<T>).then(
				(v: T) => {
					if (computed.generation !== gen) return;
					computed.value = v;
					computed.didSuspend = false;
					computed.hasResolved = true;
					computed.lastErrored = false;
					batchStart();
					propagateFromSignal(computed);
					batchEnd();
				},
				(e: any) => {
					if (computed.generation !== gen) return;
					computed.value = e;
					computed.didError = true;
					computed.didSuspend = false;
					computed.hasResolved = true;
					computed.lastErrored = true;
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
