import type SlotRender from "../../../../src/types/SlotRender";

declare function DynamicTag(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { tag: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default DynamicTag;
