import type SlotRender from "../../../../src/types/SlotRender";

declare function BubbleTargets(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { targets: string[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default BubbleTargets;
