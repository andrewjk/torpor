import type SlotRender from "../../../../src/types/SlotRender";

declare function IfForSwitchCombo(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { todos: { text: string; done: boolean; priority: string }[]; filter: string; sort: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default IfForSwitchCombo;
