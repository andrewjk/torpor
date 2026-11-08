import type AsyncSettle from "./AsyncSettle";
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
	 * The result of the most recent generation-guarded settle of an `$async`
	 * computed: `{ ok: true, value }` on resolve, `{ ok: false, error }` on
	 * rejection — or `undefined` until the first settle. Read side:
	 * - `settle !== undefined` ⇔ "has resolved before" — used by `$async` to
	 *   capture `suspendQuiet`, and by the proxy get trap to distinguish a
	 *   first load (throw `AwaitSuspend`) from a refresh (stale-while-
	 *   revalidate). Monotonic — once set it stays set across subsequent
	 *   re-suspends.
	 * - `settle.ok` ⇔ the last settle resolved. On `false`, a retry-after-
	 *   error re-suspend must not hand the previous error to readers as
	 *   "stale content" (it renders as a raw value, bypassing the error
	 *   boundary).
	 * - `settle.value` on `ok === true` is the previously resolved value,
	 *   retained across a refresh suspend for stale-while-revalidate
	 *   (ASYNC.md → "Stale-while-revalidate") — read by `suspendRead` so
	 *   readers keep displaying the old value instead of a placeholder while
	 *   the new promise is in flight.
	 *
	 * Written only by `$async`'s settle handlers (and hydration seeding), so
	 * it is generation-safe by construction. Unused by plain `$cache`
	 * computeds (always `undefined`).
	 */
	settle: AsyncSettle | undefined;

	/**
	 * True when the current suspend is a "bare refresh" — a re-fetch with no
	 * tracked dependency change, i.e. a silent `$refresh(fn, { silent: true })`
	 * (background revalidation), per ASYNC.md → "Loud vs quiet")
	 * `$pending` reads this to stay quiet (return `false`) on silent refreshes,
	 * matching Solid's stale-while-revalidate default.
	 *
	 * Captured at suspend time inside `$async`'s run: a suspend is quiet iff
	 * the computed has settled before (`settle !== undefined`) AND the run was
	 * NOT source-driven (`recalc === false`, i.e. not triggered by
	 * `checkComputed` and not a loud `$refresh`). First loads are always loud
	 * (`settle` is undefined); dependency-change refreshes and loud `$refresh`
	 * calls are always loud (`recalc` is true).
	 */
	suspendQuiet: boolean;

	/**
	 * A subscription to roll back to when recursively updating signal targets.
	 */
	rollback: Subscription | null;

	/**
	 * The name of the computed property, for debugging.
	 */
	name?: string;
}
