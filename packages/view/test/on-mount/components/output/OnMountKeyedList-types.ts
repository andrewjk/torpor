import type SlotRender from "../../../../src/types/SlotRender";

declare function MountEffectList(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: Array<{ id: number; value: string }> },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default MountEffectList;
