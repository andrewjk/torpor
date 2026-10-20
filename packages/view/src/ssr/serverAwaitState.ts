/**
 * The per-request state for a `source: "server"` async render. Server awaits
 * are orchestrated by `t_server_flush` (the component's render) and
 * `t_await_server` (each `@await` boundary), which coordinate through the
 * module-level `current` pointer:
 *
 * - **Collect phase** — the boundary's content is rendered speculatively (a
 *   discarded pass) purely to invoke its getters. Each `source: "server"`
 *   getter read calls its thunk (starting the fetch) and records the promise
 *   here. Sibling reads in the same pass therefore start in one wave, exactly
 *   like the client's speculative render.
 * - **Render phase** — after the recorded promises settle, the content is
 *   rendered again; getter reads look up the settled value by getter identity
 *   (watched object + property key), so the pass may read a getter a different
 *   number of times than the collect pass did. The second pass's output is
 *   what ships.
 *
 * `current` is only ever read synchronously (inside a helper's render
 * segments), so concurrent requests interleave safely: each helper captures
 * and restores the pointer around its awaits.
 */
export default interface ServerAwaitState {
	/** "collect" during the speculative pass, "render" during the resolved pass. */
	phase: "collect" | "render";

	/**
	 * Recorded `source: "server"` reads, in first-read order. Each entry holds
	 * the getter identity, the promise, its per-getter timeout, and — once
	 * settled — the fulfilled value or rejection. A getter read more than once
	 * is recorded once, so repeated reads share one fetch.
	 */
	promises: ServerPromiseEntry[];

	/**
	 * Recorded reads made during the render pass, in first-read order. This is
	 * the order the client will read the getters during hydration, so it also
	 * determines the payload's value order.
	 */
	renderEntries: ServerPromiseEntry[];

	/** Entries in `renderEntries`, for O(1) dedup while rendering. */
	renderSeen: Set<ServerPromiseEntry>;

	/**
	 * Client-fetch `$async` reads made during the render pass (the server
	 * stub's no-option calls). Any of these would suspend on the client, so a
	 * boundary that touched one cannot ship resolved content — it degrades.
	 */
	clientReads: number;

	/**
	 * Nested boundary states created inside this boundary's collect pass,
	 * keyed by `"<site id>:<occurrence>"`. The render pass re-invokes each
	 * nested boundary in the same order, so it looks up the state by the same
	 * key and awaits its final HTML instead of re-fetching.
	 */
	children: Map<string, Promise<{ body: string; head: string }>>;

	/** Per-site occurrence counters, reset at the start of each pass. */
	counters: Map<string, number>;

	/** Set when the boundary degrades to its `with` branch. */
	degraded: boolean;

	/**
	 * True for component flush roots. A flush root is a collect-phase context
	 * but not a recording one: `source: "server"` reads outside any boundary
	 * don't fetch. Boundaries created directly under the root stash their
	 * final HTML here, keyed by the sentinel they returned.
	 */
	isRoot: boolean;

	/**
	 * Stashed boundary lifecycles keyed by sentinel comment, for substitution
	 * at the end of the flush (or a degraded `with` branch's render). Only
	 * used by flush roots.
	 */
	sentinels: Map<string, Promise<{ body: string; head: string }>>;
}

/**
 * A recorded `source: "server"` read: the getter identity, the promise
 * returned by the getter's thunk, and the settled outcome once it arrives.
 */
export interface ServerPromiseEntry {
	/** The watched object (or null for an untracked getter). */
	owner: object | null;
	/** The property key on `owner` (or the thunk source when untracked). */
	key: PropertyKey | string;
	promise: Promise<any>;
	timeout: number;
	/** Set by the settle handler: `{ ok: true, value }` or `{ ok: false, error }`. */
	result?: { ok: true; value: any } | { ok: false; error: any };
}

/**
 * The sentinel thrown when the render pass reads a `source: "server"` getter
 * that the collect pass never recorded (or one whose value hasn't settled).
 * Only this error degrades the boundary; real render errors propagate.
 */
export class ServerAwaitMisaligned extends Error {
	constructor() {
		super("Server await render pass did not match the collect pass");
	}
}

/** The innermost active server await state, or null outside any. */
let current: ServerAwaitState | null = null;

/**
 * Runs `fn` with `state` as the current server await state. `fn` may be sync
 * or async; the pointer is restored when it settles. Because the pointer is
 * only read synchronously, interleaved async renders restore it correctly.
 */
export async function withServerAwait<T>(
	state: ServerAwaitState | null,
	fn: () => T | Promise<T>,
): Promise<T> {
	const previous = current;
	current = state;
	try {
		return await fn();
	} finally {
		current = previous;
	}
}

/** The current server await state, or null. Only read synchronously. */
export function currentServerAwait(): ServerAwaitState | null {
	return current;
}

/** Creates a fresh state for one boundary (or component flush root). */
export function newServerAwaitState(): ServerAwaitState {
	return {
		phase: "collect",
		promises: [],
		renderEntries: [],
		renderSeen: new Set(),
		clientReads: 0,
		children: new Map(),
		counters: new Map(),
		degraded: false,
		isRoot: false,
		sentinels: new Map(),
	};
}

/**
 * The occurrence key for a nested boundary call site: `"<id>:<n>"`. The
 * counter lives on the enclosing state and resets each pass, so the collect
 * and render passes derive identical key sequences.
 */
export function childKey(state: ServerAwaitState, id: string): string {
	const n = state.counters.get(id) ?? 0;
	state.counters.set(id, n + 1);
	return `${id}:${n}`;
}
