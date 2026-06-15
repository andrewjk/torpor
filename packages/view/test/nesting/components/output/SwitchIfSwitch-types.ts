import type SlotRender from "../../../../src/types/SlotRender";

declare function SwitchInsideIfInsideSwitch(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { level: string; kind: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default SwitchInsideIfInsideSwitch;
