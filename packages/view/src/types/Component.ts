import { type SlotRender } from "./SlotRender";

/**
 * A component that can be mounted or hydrated
 */
export type Component = (
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
) => void;
