import context from "../render/context";

/**
 * Returns `true` if any value read inside `fn` is currently suspended (a
 * `$await` getter whose promise hasn't resolved yet). A reactive query for
 * inline "loading…" indicators — the calling effect subscribes to the same
 * computeds, so `$pending` re-evaluates when they resolve.
 *
 * Uses a "peek mode" internally: reads during `fn` are tracked for
 * subscription but don't propagate taint or notify a `@loading` boundary.
 * This lets `$pending` return a plain boolean without itself suspending.
 *
 * Note: this is the basic version — it returns `true` whenever a read
 * computed is in-flight, regardless of whether it's a first load or a
 * refresh. The "quiet on bare refresh" semantics (ASYNC.md §7.4) are a
 * future enhancement.
 *
 * @param fn A function that reads the reactive values to check.
 */
export default function $pending(fn: () => any): boolean {
	const oldPeek = context.suspendPeek;
	context.suspendPeek = true;
	context.suspendPeekHit = false;
	try {
		fn();
		return context.suspendPeekHit;
	} finally {
		context.suspendPeek = oldPeek;
	}
}
