import type SlotRender from "../../../../src/types/SlotRender";

declare function TextEscape(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { code: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default TextEscape;
