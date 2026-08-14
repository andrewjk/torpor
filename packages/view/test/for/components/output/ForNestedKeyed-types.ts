import type SlotRender from "../../../../src/types/SlotRender";

declare function ForNestedKeyed(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: {
		groups: Array<{ id: string, items: Array<{ id: number, label: string }> }>,
	},
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForNestedKeyed;
