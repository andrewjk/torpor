import type SlotRender from "../../../../src/types/SlotRender";

declare function Probe(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: { name: string }[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default Probe;
