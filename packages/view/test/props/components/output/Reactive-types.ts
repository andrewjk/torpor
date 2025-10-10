import type SlotRender from "../../../../src/types/SlotRender";

declare function Reactive(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: any,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default Reactive;
