import type SlotRender from "../../../../src/types/SlotRender";

declare function SwitchComponent(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { mode: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default SwitchComponent;
