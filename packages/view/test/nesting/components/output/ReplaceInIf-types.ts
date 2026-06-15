import type SlotRender from "../../../../src/types/SlotRender";

declare function ReplaceInIf(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { counter: number; show: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ReplaceInIf;
