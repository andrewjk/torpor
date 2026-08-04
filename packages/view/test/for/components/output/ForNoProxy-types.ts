import type SlotRender from "../../../../src/types/SlotRender";

declare function ForNoProxy(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: Array<{ id: number, label: string }> },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForNoProxy;
