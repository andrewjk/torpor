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
	 * The boundary's effect, so `suspendRead` can subscribe it to a suspended
	 * computed and it re-runs when the promise resolves.
	 */
	effect: Effect | null;
}
