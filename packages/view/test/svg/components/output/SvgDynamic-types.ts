import type SlotRender from "../../../../src/types/SlotRender";

declare function SvgDynamic(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { type: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default SvgDynamic;
