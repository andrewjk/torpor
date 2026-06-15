import type SlotRender from "../../../../src/types/SlotRender";

declare function ComputedCache(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { value: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ComputedCache;
