import type SlotRender from "../../../../src/types/SlotRender";

declare function IfNested(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { counter: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default IfNested;
