import type SlotRender from "../../../../src/types/SlotRender";

declare function ForNested(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { matrix: number[][] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForNested;
