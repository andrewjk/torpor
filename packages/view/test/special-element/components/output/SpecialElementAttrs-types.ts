import type SlotRender from "../../../../src/types/SlotRender";

declare function SpecialElementAttrs(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { tag: string; content: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default SpecialElementAttrs;
