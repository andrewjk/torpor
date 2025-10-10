import type SlotRender from "../../../../src/types/SlotRender";

/**
 * A component with some text in it.
 */
declare function Text(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: {
		value: string;
		empty: string;
	},
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default Text;
