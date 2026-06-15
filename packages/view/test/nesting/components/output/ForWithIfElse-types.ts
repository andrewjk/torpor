import type SlotRender from "../../../../src/types/SlotRender";

declare function ForWithIfElse(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { tabs: string[]; activeTab: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForWithIfElse;
