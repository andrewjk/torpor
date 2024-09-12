type SlotRender = (
	parent: Node,
	anchor: Node | null,
	$props?: Record<string, any>,
	$context?: Record<string, any>,
) => void;

export default SlotRender;
