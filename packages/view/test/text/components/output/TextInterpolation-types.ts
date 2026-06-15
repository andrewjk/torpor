import type SlotRender from "../../../../src/types/SlotRender";

declare function TextInterpolation(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { name: string; count: number; active: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default TextInterpolation;
