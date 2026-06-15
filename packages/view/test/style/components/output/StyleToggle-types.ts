import type SlotRender from "../../../../src/types/SlotRender";

declare function StyleToggle(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { active: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default StyleToggle;
