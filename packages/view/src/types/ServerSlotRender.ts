/**
 * Renders a slot fill to HTML. Async so the fill can contain an `@await`
 * boundary with a `source: "server"` getter (ASYNC.md §7.10).
 */
type ServerSlotRender = (
	$slot?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
) => Promise<string>;

export default ServerSlotRender;
