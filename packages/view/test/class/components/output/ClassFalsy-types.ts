import type SlotRender from "../../../../src/types/SlotRender";

declare function ClassFalsy(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { a: boolean; b: boolean; c: number; d: number; e: string; f: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ClassFalsy;
