import type Effect from "./Effect";

/**
 * The suspend mailbox for an active `@loading` boundary. The proxy get trap
 * sets `suspended = true` when a read hits a `didSuspend` computed; the
 * boundary effect checks this after rendering its content to decide whether
 * to discard the partial render and show fallback instead.
 *
 * `effect` is the boundary's own `$run` effect. `suspendRead` uses it to
 * subscribe the boundary directly to suspended computeds — without this, the
 * subscriptions would live on child effects that are destroyed when content
 * is cleared, and the boundary would never re-run on resolve.
 */
export default interface LoadingBoundary {
	suspended: boolean;
	effect: Effect | null;
}
