/**
 * Renders a slot fill to HTML. Async so the fill can contain an `@await`
 * boundary with a `source: "server"` getter (ASYNC.md → "Server rendering").
 */
type ServerSlotRender = (
	$slot?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
) => Promise<string>;

export default ServerSlotRender;
