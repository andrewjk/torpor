import type SlotRender from "../../../../src/types/SlotRender";

declare function IfContainingFor(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { show: boolean; items: string[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default IfContainingFor;
