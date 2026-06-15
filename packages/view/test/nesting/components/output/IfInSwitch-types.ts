import type SlotRender from "../../../../src/types/SlotRender";

declare function IfInSwitch(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { show: boolean; status: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default IfInSwitch;
