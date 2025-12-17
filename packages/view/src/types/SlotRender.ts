type SlotRender = (
	$sparent: ParentNode,
	$sanchor: Node | null,
	$slot?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
) => void;

export default SlotRender;
