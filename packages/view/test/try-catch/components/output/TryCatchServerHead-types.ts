import type SlotRender from "../../../../src/types/SlotRender";

declare function ErrorHeadDiscard(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { danger: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default ErrorHeadDiscard;
