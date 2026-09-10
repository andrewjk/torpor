import {
	childKey,
	currentServerAwait,
	newServerAwaitState,
	ServerAwaitMisaligned,
	withServerAwait,
} from "./serverAwaitState";
import type ServerAwaitState from "./serverAwaitState";
import { renderWithBranch } from "./serverSentinels";

let sentinelCount = 0;

function nextSentinel(): string {
	return `<!--t-aw:${sentinelCount++}-->`;
}

/**
 * Renders an `@await` boundary on the server (compiled as `t_await_server`).
 *
 * The generated code calls this for every `@await`, passing the boundary's
 * site id, a closure that renders the content branch, and one that renders
 * the `with` branch. It always returns a `{ body, head }` pair to append:
 *
 * - **Inside a boundary's render pass** — this boundary was already started
 *   during the collect pass; its body/head is the finished HTML (awaited if
 *   still in flight). A missing entry means the render pass doesn't match
 *   the collect pass, which degrades the enclosing boundary.
 * - **Inside a collect pass or a component flush** — start the full
 *   lifecycle (collect, settle, render) without blocking the enclosing
 *   render, and return a sentinel comment as the body. Sibling reads and
 *   nested boundaries keep rendering, so every fetch in the pass starts in
 *   one wave. The sentinel is substituted later: by the enclosing boundary's
 *   render pass (which re-invokes this helper and awaits the finished HTML),
 *   or by the component flush (which replaces top-level sentinels directly).
 *
 * The lifecycle: render content once to start the `source: "server"` fetches
 * (discarding the output), wait for them with a per-getter timeout, then
 * render again with the settled values. The second pass ships wrapped in
 * hydration markers plus a `<!--t-await:...-->` comment carrying the values
 * for the client's `$async` hydration path. Any instability — timeout, a
 * render pass that reads a different set of getters, a client-fetch read —
 * degrades to the `with` branch + client fetch, exactly the pre-`source`
 * behavior.
 *
 * @param id The boundary's site id (unique per `@await` in the component)
 * @param renderContent Renders the content branch (may read `$async` getters)
 * @param renderWith Renders the `with` branch, or null for empty
 */
export default function runServerAwait(
	id: string,
	renderContent: () => Promise<{ body: string; head: string }>,
	renderWith: (() => Promise<{ body: string; head: string }>) | null,
): { body: string; head: string } | Promise<{ body: string; head: string }> {
	const parent = currentServerAwait();

	if (parent !== null && parent.phase === "render") {
		// The enclosing boundary is rendering its resolved pass: this nested
		// boundary was started during the collect pass, so reuse its result
		const cached = parent.children.get(childKey(parent, id));
		if (cached === undefined) {
			throw new ServerAwaitMisaligned();
		}
		return cached;
	}

	const state = newServerAwaitState();
	const final = renderBoundary(state, renderContent, renderWith);

	const sentinel = nextSentinel();
	if (parent !== null) {
		if (parent.isRoot) {
			// Top-level boundary: the component flush substitutes the sentinel
			parent.sentinels.set(sentinel, final);
		} else {
			// Nested boundary: the enclosing boundary's render pass looks this
			// up by occurrence key
			parent.children.set(childKey(parent, id), final);
		}
	}
	// The sentinel body is replaced by the finished content; the head tags a
	// resolved boundary renders are hoisted when it finishes
	return { body: sentinel, head: "" };
}

/**
 * The full lifecycle for one boundary: speculative collect pass, settle, and
 * resolved render pass. Runs concurrently with the enclosing render; the
 * returned promise resolves to the boundary's final HTML.
 */
async function renderBoundary(
	state: ServerAwaitState,
	renderContent: () => Promise<{ body: string; head: string }>,
	renderWith: (() => Promise<{ body: string; head: string }>) | null,
): Promise<{ body: string; head: string }> {
	// Collect pass: render content speculatively to invoke the getters. Each
	// `source: "server"` read starts its fetch and is recorded; sibling reads
	// in this pass therefore start together. The output is discarded — reads
	// return undefined, so user markup that dereferences them may throw, and
	// a throw here costs nothing.
	await withServerAwait(state, renderContent).catch(() => {
		// Expected when unresolved values are dereferenced; fetches already
		// started. Any other error resurfaces in the render pass below.
	});

	if (state.promises.length === 0) {
		// No server-source reads: nothing was (or can be) resolved here, so
		// ship the `with` branch and let the client fetch — the default SSR
		// behavior for client-fetch getters
		return renderWithBranch(renderWith);
	}

	// Settle the recorded fetches. Each getter carries its own timeout; the
	// boundary waits for the longest, and a miss degrades the whole boundary
	// (content ships only when every read resolved)
	const timeout = Math.max(...state.promises.map((entry) => entry.timeout));
	const settled = await Promise.race([
		Promise.all(
			state.promises.map((entry) =>
				entry.promise.then(
					() => true,
					() => true,
				),
			),
		).then(
			() => true,
			() => true,
		),
		new Promise<false>((resolve) => setTimeout(resolve, timeout, false)),
	]);

	// Render pass: same reads, now consuming settled values through the
	// cursor. The pass must replay the collect pass exactly — a different
	// read count, an unknown nested boundary, or a client-fetch read all
	// mean the content can't be trusted, and the boundary degrades.
	//
	// A rejection (or any render error) also degrades: the boundary's
	// lifecycle runs detached from the enclosing render (which has already
	// moved on after the sentinel), so the error can't propagate to the
	// emitted `@try` positionally. Instead the with branch ships and the
	// client re-runs the getter, rejects there, and its `@try` renders the
	// catch branch — the same path a client-fetch error takes.
	let degraded = settled === false;
	let content: { body: string; head: string } | undefined;
	if (!degraded) {
		state.phase = "render";
		state.cursor = 0;
		state.renderReads = 0;
		state.clientReads = 0;
		state.counters.clear();
		try {
			content = await withServerAwait(state, renderContent);
			if (state.cursor !== state.promises.length || state.clientReads > 0) {
				degraded = true;
			}
		} catch {
			degraded = true;
		}
	}

	if (degraded || content === undefined) {
		state.degraded = true;
		try {
			return await renderWithBranch(renderWith);
		} catch {
			// A with-branch render error can't be positioned either; ship an
			// empty boundary rather than failing the whole response
			return { body: "<![><!]><!>", head: "" };
		}
	}

	// Ship the resolved content with the embedded values for hydration.
	// Rejections never reach here — the render pass consumes them and
	// degrades — but guard anyway so a bad entry can't ship as `undefined`
	const values: any[] = [];
	for (let i = 0; i < state.cursor; i++) {
		const result = state.promises[i].result;
		if (result === undefined) {
			degraded = true;
			break;
		}
		values.push(result.ok ? result.value : undefined);
	}
	if (degraded) {
		state.degraded = true;
		return renderWithBranch(renderWith);
	}
	return {
		body: `${"<![>"}${content.body}${"<!]><!>"}${payloadComment(values)}`,
		head: content.head,
	};
}

/**
 * The `<!--t-await:...-->` comment carrying the boundary's resolved values,
 * in read order, for the client's `$async` hydration path. `-->` inside the
 * JSON is escaped so the comment can't terminate early.
 */
function payloadComment(values: any[]): string {
	const json = JSON.stringify(values).replaceAll("-->", "--\\u003E");
	return `<!--t-await:${json}-->`;
}
