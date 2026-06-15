import type SlotRender from "../../../../src/types/SlotRender";

declare function ClassToggle(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { active: boolean; emphasis: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ClassToggle;
