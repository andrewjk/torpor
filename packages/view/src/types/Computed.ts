import type Subscription from "./Subscription";

/**
 * A computed value that is lazily refreshed when accessed from an Effect or
 * another Computed. Our computed values are implemented as property getter
 * functions.
 */
export default interface Computed<T = any> {
	/**
	 * COMPUTED.
	 */
	type: 1;

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
	 * A subscription to roll back to when recursively updating signal targets.
	 */
	rollback: Subscription | null;

	/**
	 * The name of the computed property, for debugging.
	 */
	name?: string;
}
