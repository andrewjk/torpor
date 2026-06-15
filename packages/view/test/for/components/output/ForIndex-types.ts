import type SlotRender from "../../../../src/types/SlotRender";

declare function ForIndex(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { list: string[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForIndex;
