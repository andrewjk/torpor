import type AsyncOptions from "../types/AsyncOptions";
import {
	currentServerAwait,
	ServerAwaitMisaligned,
	type ServerPromiseEntry,
} from "./serverAwaitState";

/**
 * Default number of milliseconds a `source: "server"` read may take before
 * its boundary degrades to the `with` branch and the client fetches instead
 * (ASYNC.md §7.10).
 */
export const SERVER_ASYNC_TIMEOUT = 5000;

/**
 * Server counterpart of the client-side `$async` getter primitive.
 *
 * Without options (the default), this is a no-op stub: server renders are
 * synchronous, an async value never resolves during SSR, and `@await`
 * boundaries render their `with` branch and never read the getter. The stub
 * exists so server builds importing `$async` don't emit a dangling import.
 * A read inside a boundary's render pass is still recorded, so the boundary
 * degrades to the `with` branch + client fetch instead of shipping content
 * that would suspend on the client.
 *
 * With `{ source: "server" }` the getter participates in the server's
 * collect/render pass (ASYNC.md §7.10):
 *
 * - **Collect pass** — calls the thunk (starting the fetch) and records the
 *   promise on the enclosing boundary, so sibling reads start in one wave.
 *   Returns `undefined`; the speculative pass's output is discarded.
 * - **Render pass** — returns the settled value from the recorded promise at
 *   the same position in read order, without calling the thunk again. A
 *   rejection is re-thrown here so `@try`/`@error` handles it like any other
 *   render error. Running past the recorded reads throws a sentinel that
 *   degrades the boundary (the render pass no longer matches the collect
 *   pass, so the shipped HTML can't be trusted).
 *
 * Outside any `@await` boundary (including in a `with` branch) a
 * `source: "server"` read returns `undefined` without fetching — the same
 * undefined-then-recover contract the client has for un-boundaried reads.
 */
export default function $serverAsync<T>(fn: () => Promise<T>, options?: AsyncOptions): T {
	const state = currentServerAwait();

	if (state === null || state.isRoot || options?.source !== "server") {
		if (state !== null && !state.isRoot && state.phase === "render") {
			// A client-fetch read during a boundary's render pass: the client
			// will suspend on it, so the boundary can't ship resolved content
			state.clientReads++;
		}
		return undefined as T;
	}

	if (state.phase === "collect") {
		const entry: ServerPromiseEntry = {
			promise: fn(),
			timeout: options.timeout ?? SERVER_ASYNC_TIMEOUT,
		};
		// Record the outcome as soon as it settles — this both captures the
		// value/error for the render pass and consumes the rejection, so a
		// boundary that degrades (timeout) or a superseded fetch can never
		// surface as an unhandled rejection
		entry.promise.then(
			(value) => {
				entry.result = { ok: true, value };
			},
			(error) => {
				entry.result = { ok: false, error };
			},
		);
		state.promises.push(entry);
		return undefined as T;
	}

	// Render pass: consume the recorded read at this position
	const index = state.cursor;
	if (index >= state.promises.length) {
		throw new ServerAwaitMisaligned();
	}
	state.cursor++;
	state.renderReads++;
	const result = state.promises[index].result;
	if (result === undefined) {
		// Not settled — only possible when the boundary already blew its
		// timeout, which degrades before rendering; treat as misaligned
		throw new ServerAwaitMisaligned();
	}
	if (result.ok) {
		return result.value as T;
	}
	throw result.error;
}
