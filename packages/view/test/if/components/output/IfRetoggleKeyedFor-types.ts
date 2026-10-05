import type SlotRender from "../../../../src/types/SlotRender";

declare function IfRetoggle(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { mounted: boolean; sections: Record<string, { tabs: { id: number; text: string }[] }> },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default IfRetoggle;
