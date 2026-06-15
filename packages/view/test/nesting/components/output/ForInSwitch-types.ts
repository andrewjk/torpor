import type SlotRender from "../../../../src/types/SlotRender";

declare function ForInSwitch(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { choice: string; items: string[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForInSwitch;
