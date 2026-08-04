import type SlotRender from "../../../../src/types/SlotRender";

declare function ClassString(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { size: string; color: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ClassString;
