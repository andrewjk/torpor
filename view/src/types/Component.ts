import type SlotRender from "./SlotRender";

/**
 * A component that can be mounted or hydrated
 */
export default interface Component {
	name: string;
	render: (
		parent: Node,
		anchor: Node | null,
		$props?: Record<string, any>,
		$context?: Record<string, any>,
		$slots?: Record<string, SlotRender>,
	) => void;
}
