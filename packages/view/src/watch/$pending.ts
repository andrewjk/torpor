import context from "../render/context";

/**
 * Returns `true` if any value read inside `fn` is currently suspended in a
 * "loud" way — a `$async` getter whose promise hasn't resolved yet. A reactive
 * query for inline "loading…" indicators: the calling effect subscribes to the
 * same computeds, so `$pending` re-evaluates when they resolve.
 *
 * Uses a "peek mode" internally: reads during `fn` are tracked for
 * subscription but don't propagate taint or notify a `@await` boundary.
 * This lets `$pending` return a plain boolean without itself suspending.
 *
 * Quiet-on-refresh semantics (ASYNC.md → "Loud vs quiet"): a suspend is *quiet* — and
 * therefore `$pending` returns `false` for it — when the computed has resolved
 * before and the re-fetch was a *silent* `$refresh(fn, { silent: true })` (a
 * bare refresh with no tracked dependency change, used for background
 * revalidation). This matches Solid's stale-while-revalidate default: quietly
 * re-asking the same question shouldn't ping the user. First loads and
 * dependency-change refreshes are loud (`true`), as is the default (loud)
 * `$refresh(fn)`. Quiet-ness is captured per computed at suspend time via
 * `suspendQuiet` (computed in `$async`'s run from `hasResolved` and `recalc`).
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
