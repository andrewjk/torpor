import type SlotRender from "../../../../src/types/SlotRender";

declare function IfContainingIf(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { condition: boolean, counter: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default IfContainingIf;
