import type SlotRender from "./SlotRender";

/**
 * A component that can be mounted or hydrated
 */
type Component = (
	$parent: ParentNode,
	$anchor: Node | null,
	// NOTE: `any` rather than `Record<PropertyKey, any>` so that components
	// which declare props (compiling to a required `$props`) can be passed
	// anywhere a Component is expected
	$props?: any,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
) => void;

export default Component;
