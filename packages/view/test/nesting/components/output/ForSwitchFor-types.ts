import type SlotRender from "../../../../src/types/SlotRender";

declare function ForSwitchFor(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { matrix: number[][]; operation: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForSwitchFor;
