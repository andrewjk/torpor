import type SlotRender from "../../../../src/types/SlotRender";

declare function ForDeepMutation(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: Array<{ label: string }> },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForDeepMutation;
