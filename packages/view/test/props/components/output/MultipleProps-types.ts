import type SlotRender from "../../../../src/types/SlotRender";

declare function MultipleProps(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default MultipleProps;
