import type SlotRender from "../../../../src/types/SlotRender";

declare function Watched(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: any,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default Watched;
