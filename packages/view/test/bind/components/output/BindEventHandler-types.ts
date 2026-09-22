import type SlotRender from "../../../../src/types/SlotRender";

declare function BindEventHandler(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default BindEventHandler;
