import context from "../render/context";
import type Computed from "../types/Computed";
import batchEnd from "./batchEnd";
import batchStart from "./batchStart";
import clearSources from "./clearSources";
import deactivateSources from "./deactivateSources";
import { propagateFromSignal } from "./propagateSignal";
import runComputed from "./runComputed";

/**
 * Options for `$refresh`.
 */
export interface RefreshOptions {
	/**
	 * Re-fetch silently — stale-while-revalidate. The suspend is *quiet*
	 * (`$pending` stays `false`) and subscribers aren't notified until the new
	 * promise resolves. For background revalidation: polling, refetch-on-
	 * focus. Defaults to `false` — a refresh is loud, so `$pending` reads
	 * `true` and inline "updating…" indicators flip on at refresh start.
	 */
	silent?: boolean;
}

/**
 * Re-fetches the `$await` getters read inside `fn` without changing a
 * dependency. A companion to `$pending` (ASYNC.md §6.2): pull-to-refresh,
 * refresh buttons, refetch-on-focus, polling, retry-after-error.
 *
 * `fn` is run in a tracking context that collects every `$await` computed it
 * reads (`$cache` computeds are ignored). Each collected computed is then
 * re-run with `recalc` left true — a "bare refresh" — so the suspend is
 * *loud*: `$pending(fn)` returns `true` while the re-fetch is in flight and
 * subscribers are notified at suspend *start*, so an inline "updating…"
 * indicator appears immediately. Readers keep displaying the previous
 * resolved value (`Computed.staleValue`) until the new promise resolves and
 * propagates through the reactive graph; an `@loading` boundary keeps its
 * content mounted instead of flashing fallback.
 *
 * Pass `{ silent: true }` to re-fetch quietly (stale-while-revalidate):
 * `$pending(fn)` stays `false` and nothing re-runs until the new promise
 * resolves. For background revalidation where feedback would be noise —
 * polling, refetch-on-focus:
 *
 * ```torp
 * // poll quietly every 30s
 * $run(() => {
 * 	const id = setInterval(() => $refresh(() => $state.data, { silent: true }), 30_000);
 * 	return () => clearInterval(id);
 * });
 * ```
 *
 * A refresh is loud regardless of `silent` when the computed has never
 * resolved — e.g. retrying after an error that left `didError` set on a first
 * load — or when the re-fetch is triggered by a dependency change, which
 * flows through the normal `recalc` path instead of here.
 *
 * The returned value of `fn` is ignored; use `fn` to reference the getters.
 */
export default function $refresh(fn: () => any, options?: RefreshOptions): void {
	const silent = options?.silent === true;

	const oldRefreshSignals = context.refreshSignals;
	const oldPeek = context.suspendPeek;
	context.refreshSignals = [];
	context.suspendPeek = true;
	let unique: Set<Computed>;
	try {
		fn();
		// Dedupe — fn may read the same getter several times.
		unique = new Set<Computed>(context.refreshSignals ?? []);
	} finally {
		context.refreshSignals = oldRefreshSignals;
		context.suspendPeek = oldPeek;
	}

	for (const computed of unique) {
		// Bare refresh: recalc must be true when `$await`'s run captures
		// suspendQuiet so the suspend reads as loud (suspendQuiet =
		// hasResolved && !recalc = false), and false for a silent refresh
		// (quiet). Restore it after the run.
		computed.recalc = !silent;
		deactivateSources(computed);
		// Re-run with no active target so the refresh doesn't subscribe the
		// caller (e.g. the effect that triggered it) to the computed — an
		// imperative refresh must not make its caller re-run on resolve
		// (which could loop if the caller refreshes unconditionally). The
		// computed still subscribes to its own sources for future
		// dependency-change re-fetches.
		const oldActiveTarget = context.activeTarget;
		context.activeTarget = null;
		try {
			runComputed(computed);
		} finally {
			context.activeTarget = oldActiveTarget;
		}
		computed.recalc = false;
		clearSources(computed);

		if (!silent) {
			// A loud refresh notifies subscribers at suspend *start* so
			// `$pending` indicators (which subscribe to the computed) flip on
			// immediately and show the "updating…" UI while the fetch is in
			// flight. Readers re-read the retained staleValue, so content
			// doesn't flicker. A silent refresh stays quiet until resolve.
			batchStart();
			propagateFromSignal(computed);
			batchEnd();
		}
	}
}
