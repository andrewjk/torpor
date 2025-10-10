import type SlotRender from "../../../../src/types/SlotRender";

declare function IfCache(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { counter: number, i: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default IfCache;
