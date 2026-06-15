import type SlotRender from "../../../../src/types/SlotRender";

declare function DeepAccess(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { user: { profile: { name: string; address: { city: string } } } },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default DeepAccess;
