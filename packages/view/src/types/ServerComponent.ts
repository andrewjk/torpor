import type ServerSlotRender from "./ServerSlotRender";

/**
 * A component that generates HTML
 */
type ServerComponent = (
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>,
) => { body: string; head: string };

export default ServerComponent;
