import type SlotRender from "./SlotRender";

type ServerComponentRender = (
	$props?: Record<string, any>,
	$slots?: Record<string, SlotRender>,
	$context?: Record<string, any>,
) => void;

export default ServerComponentRender;
