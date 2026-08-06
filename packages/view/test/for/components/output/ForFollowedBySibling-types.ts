import type SlotRender from "../../../../src/types/SlotRender";

declare function ForFollowedByIf(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: string[], show: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForFollowedByIf;
