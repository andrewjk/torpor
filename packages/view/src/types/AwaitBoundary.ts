import type Computed from "./Computed";
import type Effect from "./Effect";

/**
 * The suspend mailbox for an active `@await` boundary. The proxy get trap
 * sets `.suspended = true` on this when a read hits a `didSuspend` computed;
 * the boundary effect checks it after rendering content to decide between the
 * content and `with` branches.
 */
export default interface AwaitBoundary {
	/**
	 * True if a read inside the boundary's content touched a suspended
	 * computed, so the partial content render must be discarded in favor of
	 * the `with` branch.
	 */
	suspended: boolean;

	/**
	 * The distinct suspended `Computed`s read inside this boundary's content
	 * (added by `suspendRead`). On each boundary re-run, entries that have
	 * resolved drop out and still-suspended ones re-subscribe the boundary
	 * effect (its source subscriptions are deactivated before every re-run);
	 * a non-empty set means the boundary is still suspended. This keeps the
	 * suspend check O(pending reads) instead of walking all effect sources,
	 * and keeps the boundary subscribed across no-op re-runs.
	 */
	pending: Set<Computed>;

	/**
	 * The boundary's effect, so `suspendRead` can subscribe it to a suspended
	 * computed and it re-runs when the promise resolves.
	 */
	effect: Effect | null;
}
