import type SlotRender from "../../../../src/types/SlotRender";

declare function ForObject(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { fruits: { name: string; color: string }[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForObject;
