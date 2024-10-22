type SlotRender = (
	parent: ParentNode,
	anchor: Node | null,
	$props?: Record<string, any>,
	$context?: Record<string, any>,
) => void;

export default SlotRender;
