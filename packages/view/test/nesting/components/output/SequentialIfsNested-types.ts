import type SlotRender from "../../../../src/types/SlotRender";

declare function SeqIfsNested(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { a: boolean; b: boolean; c: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default SeqIfsNested;
