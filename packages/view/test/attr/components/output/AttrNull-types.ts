import type SlotRender from "../../../../src/types/SlotRender";

declare function AttrNull(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { title: string | null; label: string | undefined; count: number | null },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default AttrNull;
