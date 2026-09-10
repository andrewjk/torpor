import { newServerAwaitState, withServerAwait } from "./serverAwaitState";
import type ServerAwaitState from "./serverAwaitState";

/** Comment prefix marking an unsubstituted boundary sentinel. */
export const SENTINEL_PREFIX = "<!--t-aw:";

/** The body/head pair that server components and boundaries render into. */
export interface ServerHtml {
	body: string;
	head: string;
}

/**
 * Renders a component's (or a degraded boundary's `with` branch's) markup
 * with a fresh flush root as the enclosing await state, then substitutes any
 * boundary sentinels with their final HTML.
 *
 * Boundaries created during the render stash their lifecycle promise under a
 * sentinel comment and return the sentinel immediately, so the render itself
 * never blocks on a fetch — every `source: "server"` read in the render
 * starts in the same wave. Substitution awaits the stashed promises at the
 * end, which is the only point an async component render actually waits.
 *
 * On the client this has no counterpart: `render` here is the compiled
 * component body closure that the generated component function returns.
 */
export async function serverFlush(render: () => Promise<ServerHtml>): Promise<ServerHtml> {
	const state = newServerAwaitState();
	state.isRoot = true;
	const result = await withServerAwait(state, render);
	return substituteSentinels(result, state);
}

/**
 * Renders a degraded boundary's `with` branch inside its own flush root, so
 * a `with` branch containing its own `@await` boundaries still resolves
 * them, then wraps it in the boundary's hydration markers. The `with` branch
 * must not start server fetches for its own reads — the flush root isn't a
 * recording context.
 */
export async function renderWithBranch(
	renderWith: (() => Promise<ServerHtml>) | null,
): Promise<ServerHtml> {
	const html = await serverFlush(async () => {
		if (renderWith === null) {
			return { body: "", head: "" };
		}
		return renderWith();
	});
	return { body: `<![>${html.body}<!]><!>`, head: html.head };
}

/**
 * Replaces every sentinel the state stashed with its boundary's final HTML.
 * Boundary head tags are appended to the head (they hoist into the document
 * head regardless of where the boundary sits in the body). Any sentinel left
 * over means a boundary's state was lost — a bug, not a degradation path, so
 * it throws.
 */
export async function substituteSentinels(
	result: ServerHtml,
	state: ServerAwaitState,
): Promise<ServerHtml> {
	let { body, head } = result;
	for (const [sentinel, promise] of state.sentinels) {
		const html = await promise;
		body = body.split(sentinel).join(html.body);
		head += html.head;
	}
	if (body.includes(SENTINEL_PREFIX) || head.includes(SENTINEL_PREFIX)) {
		throw new Error("Unsubstituted async boundary sentinel — boundary state was lost");
	}
	return { body, head };
}
