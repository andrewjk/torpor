import type SlotRender from "../../../../src/types/SlotRender";

declare function DeepNesting(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { level: number; on: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default DeepNesting;
