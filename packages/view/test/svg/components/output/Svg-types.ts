import type SlotRender from "../../../../src/types/SlotRender";

declare function Shape(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { name: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default Shape;
