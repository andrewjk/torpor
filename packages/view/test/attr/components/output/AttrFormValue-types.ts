import type SlotRender from "../../../../src/types/SlotRender";

declare function TextareaValue(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { value: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default TextareaValue;
