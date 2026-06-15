import type SlotRender from "../../../../src/types/SlotRender";

declare function NestedReactive(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { user: { name: string; tags: string[] } },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default NestedReactive;
