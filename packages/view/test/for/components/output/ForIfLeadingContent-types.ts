import type SlotRender from "../../../../src/types/SlotRender";

declare function ForIfLeadingContent(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { todos: Array<{ id: number, done: boolean }> },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForIfLeadingContent;
