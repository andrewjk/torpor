import { type ServerSlotRender } from "./ServerSlotRender";

/**
 * A component that generates HTML
 */
export type ServerComponent = (
	$props?: Record<string, any>,
	$context?: Record<string, any>,
	$slots?: Record<string, ServerSlotRender>,
) => string;
