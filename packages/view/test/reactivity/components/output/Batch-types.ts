import type SlotRender from "../../../../src/types/SlotRender";

declare function BatchTest(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { a: number; b: number; c: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default BatchTest;
