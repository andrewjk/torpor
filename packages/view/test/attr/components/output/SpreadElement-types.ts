import type SlotRender from "../../../../src/types/SlotRender";

declare function SpreadElement(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: { attrs: Record<string, any> }[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default SpreadElement;
