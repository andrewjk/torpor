import type Computed from "../types/Computed";
import type ProxySignal from "../types/ProxySignal";

/**
 * Clear unused target subscriptions after all Effects have been run.
 *
 * NOTE: This used to walk `source.firstTarget` and unlink inactive
 * subscriptions. That walk is now skipped: inactive subs are left in the
 * target list so that `trackSignal` (which looks up existing subscriptions
 * via the target's source list) can safely reactivate them on the next run.
 * Actual cleanup of unused subscriptions happens in `clearSources`, which
 * runs after each Effect / Computed re-run and removes from both lists.
 *
 * Why this matters: with the previous design, `trackSignal` walked the
 * signal's target list to find an existing subscription, which was O(N) per
 * call for popular signals. The new design walks the target's source list
 * (bounded by the effect's dependency count, typically <10), but only works
 * if a subscription found in the source list is also still linked into the
 * signal's target list. Removing it here broke that invariant for computed
 * values that hadn't yet re-run.
 */
export default function clearTargets(_source: ProxySignal | Computed): void {
	// Intentional no-op — see comment above.
}
