import type SlotRender from "../../../../src/types/SlotRender";

declare function StatePage(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: any,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default StatePage;
