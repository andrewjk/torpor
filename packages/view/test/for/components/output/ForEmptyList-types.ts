import type SlotRender from "../../../../src/types/SlotRender";

declare function ForEmpty(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: string[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForEmpty;
