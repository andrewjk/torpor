/**
 * Server no-op for the client-side `$pending` query. Nothing is ever pending
 * during a synchronous SSR render, so the query is always `false`. The stub
 * exists so server builds importing `$pending` don't emit a dangling import.
 */
export default function $serverPending(_fn: () => any): boolean {
	return false;
}
