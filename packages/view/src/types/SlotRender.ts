type SlotRender = (
	$sparent: ParentNode,
	$sanchor: Node | null,
	$sprops?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
) => void;

export default SlotRender;
