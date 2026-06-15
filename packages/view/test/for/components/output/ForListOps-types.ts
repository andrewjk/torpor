import type SlotRender from "../../../../src/types/SlotRender";

declare function ForSort(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: string[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForSort;
