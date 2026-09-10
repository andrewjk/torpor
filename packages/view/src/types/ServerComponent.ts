import type ServerSlotRender from "./ServerSlotRender";

/**
 * A component that generates HTML. Server components are async so that a
 * `source: "server"` `@await` boundary can fetch during the render (ASYNC.md
 * §7.10); call sites await the result, which also accepts the plain object a
 * component without boundaries effectively resolves to.
 */
type ServerComponent = (
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>,
) => Promise<{ body: string; head: string }>;

export default ServerComponent;
