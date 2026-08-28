import type SlotRender from "../../../../src/types/SlotRender";

declare function MultiComponent(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { label: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default MultiComponent;
