import type SlotRender from "../../../../src/types/SlotRender";

declare function TernaryServer(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { on: boolean },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default TernaryServer;
