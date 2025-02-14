export type SlotRender = (
	parent: ParentNode,
	anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
) => void;
