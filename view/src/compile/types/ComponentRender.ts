import type SlotRender from "./SlotRender";

type ComponentRender = (
	parent: Node,
	anchor: Node | null,
	$props?: Record<string, any>,
	$slots?: Record<string, SlotRender>,
	$context?: Record<string, any>,
) => void;

export default ComponentRender;
