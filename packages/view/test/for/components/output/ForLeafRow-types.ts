import type SlotRender from "../../../../src/types/SlotRender";

declare function ForLeafRow(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: Array<{ id: number, label: string }>, onSelect: (row: { id: number }) => void },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForLeafRow;
