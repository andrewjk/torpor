import type SlotRender from "../../../../src/types/SlotRender";

declare function SwitchInFor(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: { name: string; type: string }[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default SwitchInFor;
