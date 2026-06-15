import type SlotRender from "../../../../src/types/SlotRender";

declare function DynamicTagWithAttr(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { tag: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default DynamicTagWithAttr;
