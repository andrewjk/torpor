import type Subscription from "./Subscription";
import { COMPUTED_TYPE } from "./constants";

/**
 * A computed value that is lazily refreshed when accessed from an Effect or
 * another Computed. Our computed values are implemented as property getter
 * functions.
 */
export default interface Computed<T = any> {
	/**
	 * COMPUTED.
	 */
	type: typeof COMPUTED_TYPE;

	/**
	 * True if this computed was created by `$async` (an async getter whose run
	 * returns a Promise and suspends readers until it resolves). False for
	 * plain `$cache` computeds. `$refresh` targets only `isAsync` computeds,
	 * so re-running a `$cache` getter (which would recompute a sync value for
	 * no reason) never happens.
	 */
	isAsync: boolean;

	/**
	 * The cached, computed value.
	 */
	value: T;

	/**
	 * The getter function to run to access this computed's value.
	 */
	run: () => T;

	/**
	 * The first signal or computed that causes this effect to be run.
	 */
	firstSource: Subscription | null;

	/**
	 * The first computed or effect that is triggered when this property is changed.
	 */
	firstTarget: Subscription | null;

	/**
	 * Whether the computed may need to be recalculated (if any of its sources
	 * have changed). We store this on the computed (as well as its
	 * subscription) so we don't have to check the sources every time (which may
	 * be expensive).
	 */
	recalc: boolean;

	/**
	 * Used to track cycles.
	 */
	running: boolean;

	/**
	 * True if the computed encountered an exception in its last run.
	 */
	didError: boolean;

	/**
	 * True if the computed's last run returned a pending Promise. Set by
	 * `$async`; read by the proxy get trap to suspend readers. Cleared when
	 * the promise resolves (or rejects), at which point dependents are
	 * propagated through the reactive graph.
	 */
	didSuspend: boolean;

	/**
	 * Generation counter for `$async`'s stale-resolve guard. Each run of an
	 * `$async` computed increments this; the `.then` handler captures the
	 * generation and ignores resolves from stale (previous) runs. Unused by
	 * plain `$cache` computeds.
	 */
	generation: number;

	/**
	 * True once an `$async` computed's promise has resolved or rejected at
	 * least once. Used by `$pending` to distinguish a first load (never
	 * resolved) from a refresh. Monotonic — once true it stays true across
	 * subsequent re-suspends. Unused by plain `$cache` computeds.
	 */
	hasResolved: boolean;

	/**
	 * True when the last settled result of an `$async` computed was a
	 * rejection. Set by the `.then` reject handler, cleared by the resolve
	 * handler, which also clears `staleValue` — a retry-after-error
	 * re-suspend must not hand the previous error to readers as "stale
	 * content" (it renders as a raw value, bypassing the error boundary).
	 * Unused by plain `$cache` computeds.
	 */
	lastErrored: boolean;

	/**
	 * True when the current suspend is a "bare refresh" — a re-fetch with no
	 * tracked dependency change, i.e. a silent `$refresh(fn, { silent: true })`
	 * (background revalidation), per ASYNC.md → "Loud vs quiet")
	 * `$pending` reads this to stay quiet (return `false`) on silent refreshes,
	 * matching Solid's stale-while-revalidate default.
	 *
	 * Captured at suspend time inside `$async`'s run: a suspend is quiet iff
	 * the computed has resolved before (`hasResolved`) AND the run was NOT
	 * source-driven (`recalc === false`, i.e. not triggered by `checkComputed`
	 * and not a loud `$refresh`). First loads are always loud (`hasResolved`
	 * is false); dependency-change refreshes and loud `$refresh` calls are
	 * always loud (`recalc` is true).
	 */
	suspendQuiet: boolean;

	/**
	 * The previously resolved value, retained across a refresh suspend for
	 * stale-while-revalidate (ASYNC.md → "Stale-while-revalidate"). Maintained by `$async`'s
	 * generation-guarded settle handlers — set on resolve, cleared on
	 * rejection — so it always holds the last RESOLVED value, never a
	 * superseded run's in-flight promise (rapid prop changes would otherwise
	 * render "[object Promise]"). Read by `suspendRead` so readers keep
	 * displaying the old value instead of a placeholder while the new promise
	 * is in flight. `undefined` on first load (never resolved) and for plain
	 * `$cache` computeds (which never suspend, so `suspendRead` is never
	 * reached for them).
	 */
	staleValue: any;

	/**
	 * A subscription to roll back to when recursively updating signal targets.
	 */
	rollback: Subscription | null;

	/**
	 * The name of the computed property, for debugging.
	 */
	name?: string;
}
