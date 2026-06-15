import type SlotRender from "../../../../src/types/SlotRender";

declare function MultiSelectBind(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { values: string[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default MultiSelectBind;
