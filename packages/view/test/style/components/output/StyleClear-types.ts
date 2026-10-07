import type SlotRender from "../../../../src/types/SlotRender";

declare function StyleClear(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { hidden: boolean; color: string | undefined },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default StyleClear;
