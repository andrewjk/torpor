import type SlotRender from "../../../../src/types/SlotRender";

declare function AttrDynamic(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { id: string; title: string; dataValue: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default AttrDynamic;
