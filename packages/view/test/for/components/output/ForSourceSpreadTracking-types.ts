import type SlotRender from "../../../../src/types/SlotRender";

declare function Component(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { filter: string, rows: { n: number }[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default Component;
