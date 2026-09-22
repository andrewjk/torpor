import type SlotRender from "../../../../src/types/SlotRender";

declare function IfEmptyBranchHydration(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { on?: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default IfEmptyBranchHydration;
