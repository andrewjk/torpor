import type SlotRender from "../../../../src/types/SlotRender";

declare function IfElseIf(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { count: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default IfElseIf;
