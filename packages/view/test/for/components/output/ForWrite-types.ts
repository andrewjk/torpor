import type SlotRender from "../../../../src/types/SlotRender";

declare function ForWrite(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { rows: { name: string; ok: boolean; tags: { ok: boolean }[] }[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ForWrite;
