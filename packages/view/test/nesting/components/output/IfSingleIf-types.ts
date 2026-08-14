import type SlotRender from "../../../../src/types/SlotRender";

declare function IfSingleIf(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { outer: boolean, inner: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default IfSingleIf;
