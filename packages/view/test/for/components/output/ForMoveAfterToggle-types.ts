import type SlotRender from "../../../../src/types/SlotRender";

declare function ForMoveAfterToggle(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { todos: Array<{ id: number, done: boolean }> },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForMoveAfterToggle;
