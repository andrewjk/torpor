import type SlotRender from "../../../../src/types/SlotRender";

declare function ControlInSlot(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: { name: string; visible: boolean }[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ControlInSlot;
