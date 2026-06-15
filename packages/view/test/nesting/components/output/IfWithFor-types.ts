import type SlotRender from "../../../../src/types/SlotRender";

declare function SwitchInIf(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: string[]; toggle: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default SwitchInIf;
