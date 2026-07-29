import type SlotRender from "../../../../src/types/SlotRender";

declare function ForReplace(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: Array<{ id: number, name: string }> },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForReplace;
