import type SlotRender from "../../../../src/types/SlotRender";

declare function NestedComponent(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { parentName: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default NestedComponent;
