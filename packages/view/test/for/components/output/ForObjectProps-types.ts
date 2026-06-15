import type SlotRender from "../../../../src/types/SlotRender";

declare function ForObjectProps(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: { id: number; name: string; active: boolean }[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForObjectProps;
