import type SlotRender from "../../../../src/types/SlotRender";

declare function Self(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { level: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default Self;
