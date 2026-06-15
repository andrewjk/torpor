import type SlotRender from "../../../../src/types/SlotRender";

declare function SwitchString(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { status: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default SwitchString;
