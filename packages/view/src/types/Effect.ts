import type Cleanup from "./Cleanup";
import type Computed from "./Computed";
import type ProxySignal from "./ProxySignal";
import type Region from "./Region";
import type Subscription from "./Subscription";
import { EFFECT_TYPE } from "./constants";

/**
 * An effect that is run and re-run when the properties it depends on change.
 */
export default interface Effect {
	/**
	 * EFFECT.
	 */
	type: typeof EFFECT_TYPE;

	/**
	 *
	 * @returns An optional cleanup function, to run when the effect is re-run or disposed.
	 */
	run: () => Cleanup | void;

	/**
	 * The optional cleanup function that may have been returned from the run function.
	 */
	cleanup: Cleanup | void;

	/**
	 * The first signal or computed that causes this effect to be run.
	 */
	firstSource: Subscription | null;

	/*
	 * The effect that is run after this one, which may be a sibling or child.
	 */
	nextEffect: Effect | null;

	/**
	 * The number of children of this effect.
	 */
	extent: number;

	/**
	 * True while the effect is linked into the current run queue. Reset as
	 * soon as the effect is processed, so a signal write later in the same
	 * flush — or during the effect's own run — can correctly re-queue it.
	 */
	queued: boolean;

	/**
	 * True if the effect encountered an exception in its last run.
	 */
	didError: boolean;

	/**
	 * True if the effect's last run read a suspended (`didSuspend`) computed.
	 * Set by the proxy get trap's suspend-taint propagation. Unused by the
	 * effect machinery itself (effects don't cache values); present for
	 * symmetry with Computed and to let `runEffect` skip finalization on a
	 * suspended run.
	 */
	didSuspend: boolean;

	/**
	 * The name of the effect, for debugging.
	 */
	name?: string;

	/**
	 * The region that was active when this effect was created, and which
	 * owns its cleanup. Used by `routeEffectError` to walk to the nearest
	 * enclosing error boundary.
	 */
	region?: Region | null;

	/**
	 * The effect's source signals, captured just before `clearSources` runs
	 * after a failed run (see `runEffect`). Read by `routeEffectError` so an
	 * error boundary can hold the subscriptions needed for recovery.
	 */
	errorSources?: (ProxySignal | Computed)[] | null;

	/**
	 * True when this effect wraps a `$mount`/`onmount` callback (created by
	 * `runMountSideEffects`). Mount effects run once per region mount and must
	 * NOT be force re-run by the keyed-list reconciler's
	 * `rerunEffectsOnRegion` — doing so fires `onmount` on every item update.
	 * Their reactive re-runs (if any) are still driven by the normal signal
	 * path (`checkEffect`).
	 */
	isMountEffect?: boolean;

	/**
	 * When set, a bitmask of the `@for` loop-variable positions that this
	 * effect's body reads (computed at compile time by scanning for
	 * substituted data-bag paths). Bit N corresponds to the Nth for-var.
	 * Used by `rerunRegionEffects` on the no-proxy keyed-list path to skip
	 * effects that don't depend on any of the changed for-vars via a single
	 * bitwise AND.
	 *
	 * - `undefined`: dependency info not available — re-run unconditionally
	 *   (backward-compatible behaviour for effects emitted outside the
	 *   for-body builders, e.g. mount-time animations).
	 * - `0`: the effect reads no for-vars at all — skip on any field change
	 *   (it has its own signal subscriptions for other reactive state).
	 * - `> 0`: re-run only when `(forVarMask & changedMask) !== 0`.
	 */
	forVarMask?: number;
}
