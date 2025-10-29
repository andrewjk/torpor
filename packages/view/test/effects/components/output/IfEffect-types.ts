import type SlotRender from "../../../../src/types/SlotRender";

declare function If(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { counter: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default If;
