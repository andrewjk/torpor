import type SlotRender from "../../../../src/types/SlotRender";

declare function HtmlUpdate(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { html: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default HtmlUpdate;
