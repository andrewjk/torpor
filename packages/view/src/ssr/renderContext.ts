/**
 * The `$context` key holding the time (from `Date.now()`) a server render
 * started. `source: "server"` `$async` timeouts count from it, so nested
 * boundaries -- which only start once the boundary around them has resolved
 * -- share one time limit rather than each adding its own wait to the
 * response.
 */
const RENDER_STARTED: unique symbol = Symbol.for("torp.RenderStarted");

/**
 * Returns the context for a server component's render (compiled as
 * `t_render_context`). The component at the root of a render stamps the
 * start time into a copy of the context it was given, so the caller's object
 * isn't changed and a later render with the same context starts afresh; its
 * descendants receive the stamped context and keep it.
 */
export function renderContext(
	context: Record<PropertyKey, any> | undefined,
): Record<PropertyKey, any> {
	if (context?.[RENDER_STARTED] !== undefined) {
		return context;
	}
	return { ...context, [RENDER_STARTED]: Date.now() };
}

/**
 * The time the server render started, or now when the context wasn't
 * stamped (e.g. code compiled before the stamp existed).
 */
export function renderStarted(context: Record<PropertyKey, any> | undefined): number {
	return context?.[RENDER_STARTED] ?? Date.now();
}
