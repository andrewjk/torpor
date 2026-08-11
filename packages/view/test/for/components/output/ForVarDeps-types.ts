import type SlotRender from "../../../../src/types/SlotRender";

declare function ForVarDeps(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: Array<{ id: number, a: string, b: string }> },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForVarDeps;
