import type SlotRender from "../../../../src/types/SlotRender";

declare function Links(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { href: string; items: string[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default Links;
