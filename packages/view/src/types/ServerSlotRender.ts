type ServerSlotRender = (
	$slot?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
) => string;

export default ServerSlotRender;
