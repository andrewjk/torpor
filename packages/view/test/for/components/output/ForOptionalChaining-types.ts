import type SlotRender from "../../../../src/types/SlotRender";

declare function ForOptionalChaining(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: {
		items: { name: string; hasChildren?: boolean }[]
	},
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForOptionalChaining;
