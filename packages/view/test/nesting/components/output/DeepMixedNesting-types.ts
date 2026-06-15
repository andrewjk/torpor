import type SlotRender from "../../../../src/types/SlotRender";

declare function DeepMixed(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { a: boolean; b: boolean; c: boolean; d: boolean; e: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default DeepMixed;
