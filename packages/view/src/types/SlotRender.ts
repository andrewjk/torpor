type SlotRender = (
	parent: ParentNode,
	anchor: Node | null,
	$sprops?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
) => void;

export default SlotRender;
