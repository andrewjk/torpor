import type SlotRender from "../../../../src/types/SlotRender";

declare function ForAwaitReactive(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { ids: number[]; loaded: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForAwaitReactive;
