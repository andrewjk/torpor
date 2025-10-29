import type SlotRender from "../../../../src/types/SlotRender";

declare function IfElse(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { counter: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default IfElse;
