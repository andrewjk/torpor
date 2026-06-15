import type SlotRender from "../../../../src/types/SlotRender";

declare function StyleCustomProp(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { styleVar: string; customProp: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default StyleCustomProp;
