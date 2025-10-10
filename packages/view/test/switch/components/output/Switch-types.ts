import type SlotRender from "../../../../src/types/SlotRender";

interface Props {
	/** The value to switch on */
	value: number
}

/**
 * A component with a switch statement in it.
 */
declare function Switch(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Props,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default Switch;
