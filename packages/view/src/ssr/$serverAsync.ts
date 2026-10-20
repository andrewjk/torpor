import type AsyncOptions from "../types/AsyncOptions";
import { currentServerReadSite } from "./$serverWatch";
import type ServerAwaitState from "./serverAwaitState";
import {
	currentServerAwait,
	ServerAwaitMisaligned,
	type ServerPromiseEntry,
} from "./serverAwaitState";

/**
 * Default number of milliseconds a `source: "server"` read may take before
 * its boundary degrades to the `with` branch and the client fetches instead
 * (ASYNC.md → "Server rendering").
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
 * collect/render pass (ASYNC.md → "Server rendering"):
 *
 * - **Collect pass** — calls the thunk (starting the fetch) and records the
 *   promise on the enclosing boundary, so sibling reads start in one wave.
 *   The read is keyed by getter identity (watched object + property key), so
 *   reading the same getter again reuses the recorded fetch. Returns
 *   `undefined`; the speculative pass's output is discarded.
 * - **Render pass** — returns the settled value for the same getter identity,
 *   without calling the thunk again. The pass may read a getter any number of
 *   times, so markup may branch on the resolved value. A rejection is
 *   re-thrown here so `@try`/`@error` handles it like any other render error.
 *   Reading a getter the collect pass never touched throws a sentinel that
 *   degrades the boundary (its value can't be resolved without fetching, and
 *   the shipped HTML can't be trusted).
 *
 * Outside any `@await` boundary (including in a `with` branch) a
 * `source: "server"` read returns `undefined` without fetching — the same
 * undefined-then-recover contract the client has for un-boundaried reads.
 */
export default function $serverAsync<T>(
	fn: (serverValue?: T) => Promise<T>,
	options?: AsyncOptions,
): T {
	const state = currentServerAwait();

	if (state === null || state.isRoot || options?.source !== "server") {
		if (state !== null && !state.isRoot && state.phase === "render") {
			// A client-fetch read during a boundary's render pass: the client
			// will suspend on it, so the boundary can't ship resolved content
			state.clientReads++;
		}
		return undefined as T;
	}

	// Identity captured before the thunk runs: reads inside the thunk (e.g.
	// `$state.id`) must not be mistaken for the getter being read here
	const site = currentServerReadSite();
	const owner = site?.owner ?? null;
	const key = site?.key ?? fn.toString();

	if (state.phase === "collect") {
		// A repeated read of the same getter shares the first fetch
		const existing = findEntry(state, owner, key);
		if (existing === undefined) {
			const entry: ServerPromiseEntry = {
				owner,
				key,
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
		}
		return undefined as T;
	}

	// Render pass: look the recorded read up by getter identity
	const entry = findEntry(state, owner, key);
	if (entry === undefined) {
		throw new ServerAwaitMisaligned();
	}
	if (!state.renderSeen.has(entry)) {
		state.renderSeen.add(entry);
		state.renderEntries.push(entry);
	}
	const result = entry.result;
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

function findEntry(
	state: ServerAwaitState,
	owner: object | null,
	key: PropertyKey | string,
): ServerPromiseEntry | undefined {
	for (const entry of state.promises) {
		if (entry.owner === owner && entry.key === key) {
			return entry;
		}
	}
	return undefined;
}
