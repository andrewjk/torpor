import type SlotRender from "../../../../src/types/SlotRender";

declare function IfNested(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { a: boolean; b: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default IfNested;
