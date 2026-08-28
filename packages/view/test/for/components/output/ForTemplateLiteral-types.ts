import type SlotRender from "../../../../src/types/SlotRender";

declare function ForTemplateLiteral(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { slides: { index: number }[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForTemplateLiteral;
