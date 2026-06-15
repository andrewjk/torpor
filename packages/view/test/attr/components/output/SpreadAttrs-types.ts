import type SlotRender from "../../../../src/types/SlotRender";

declare function SpreadAttrs(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { collapsed: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default SpreadAttrs;
