import type SlotRender from "../../../../src/types/SlotRender";

declare function SeqIfs(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { a: boolean; b: boolean; c: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default SeqIfs;
