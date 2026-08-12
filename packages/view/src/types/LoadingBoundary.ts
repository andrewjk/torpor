/**
 * The suspend mailbox for an active `@loading` boundary. The proxy get trap
 * sets `suspended = true` when a read hits a `didSuspend` computed; the
 * boundary effect checks this after rendering its content to decide whether
 * to discard the partial render and show fallback instead.
 *
 * Pushed onto `context.loadingBoundary` (with save/restore for nesting) by
 * the boundary's render effect.
 */
export default interface LoadingBoundary {
	suspended: boolean;
}
