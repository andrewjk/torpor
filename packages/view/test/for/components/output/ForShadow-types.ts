import type SlotRender from "../../../../src/types/SlotRender";

declare function ForShadow(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { rows: Props["rows"] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForShadow;
