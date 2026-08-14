import type SlotRender from "../../../../src/types/SlotRender";

declare function ForSwitchReactive(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: Array<{ id: number, status: string }> },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForSwitchReactive;
