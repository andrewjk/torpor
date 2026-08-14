/**
 * Server no-op for the client-side `$async` getter primitive. Server renders
 * are synchronous, so an async value never resolves during SSR — `@await`
 * boundaries render their `with` branch and never read the getter. The stub
 * exists so server builds importing `$async` don't emit a dangling import.
 */
export default function $serverAsync<T>(_: () => Promise<T>): T {
	return undefined as T;
}
