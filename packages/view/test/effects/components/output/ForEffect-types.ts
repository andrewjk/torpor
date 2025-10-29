import type SlotRender from "../../../../src/types/SlotRender";

declare function For(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: { text: string }[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default For;
