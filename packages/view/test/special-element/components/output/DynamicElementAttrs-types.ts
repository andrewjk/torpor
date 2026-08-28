import type SlotRender from "../../../../src/types/SlotRender";

declare function StaticTag(
	$parent: ParentNode,
	$anchor: Node | null,
	$props,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default StaticTag;
