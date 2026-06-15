import type SlotRender from "../../../../src/types/SlotRender";

declare function ReactiveNewProp(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: string[]; newItem: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ReactiveNewProp;
