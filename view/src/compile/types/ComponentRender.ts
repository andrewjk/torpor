import type SlotRender from "./SlotRender";

type ComponentRender = (
	parent: Node,
	anchor: Node | null,
	$props?: Record<string, any>,
	$context?: Record<string, any>,
	$slots?: Record<string, SlotRender>,
) => void;

export default ComponentRender;
