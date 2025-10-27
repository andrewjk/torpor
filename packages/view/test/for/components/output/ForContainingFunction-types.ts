import type SlotRender from "../../../../src/types/SlotRender";

declare function ForContainingIf(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForContainingIf;
