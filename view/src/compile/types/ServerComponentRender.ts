import type SlotRender from "./SlotRender";

type ServerComponentRender = (
	$props?: Record<string, any>,
	$context?: Record<string, any>,
	$slots?: Record<string, SlotRender>,
) => void;

export default ServerComponentRender;
