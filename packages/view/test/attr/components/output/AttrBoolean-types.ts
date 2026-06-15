import type SlotRender from "../../../../src/types/SlotRender";

declare function AttrBoolean(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { disabled: boolean; checked: boolean; readonly: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default AttrBoolean;
