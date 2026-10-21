/**
 * Thrown when content rendered speculatively inside an `@await` boundary
 * dereferences (or calls) a first-load pending `$async` value.
 *
 * `suspendRead` normally returns `staleValue` so refresh suspends can keep
 * stale content mounted. On a first load there is no stale value, so returning
 * `undefined` would let user code throw a `TypeError` before the boundary can
 * switch to its `with` branch. Throwing this sentinel aborts the speculative
 * render instead; `runAwait` catches it and renders the fallback.
 */
export class AwaitSuspend extends Error {
	constructor() {
		super("Suspended async value");
		this.name = "AwaitSuspend";
	}
}
