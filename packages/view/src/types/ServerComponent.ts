import type ServerSlotRender from "./ServerSlotRender";

/**
 * A component that generates HTML
 */
type ServerComponent = (
	$props?: Record<string, any>,
	$context?: Record<string, any>,
	$slots?: Record<string, ServerSlotRender>,
) => { body: string; head: string };

export default ServerComponent;
