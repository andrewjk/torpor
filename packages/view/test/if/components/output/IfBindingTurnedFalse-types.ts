import type SlotRender from "../../../../src/types/SlotRender";

declare function Component(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { item: { name: string } | undefined },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default Component;
