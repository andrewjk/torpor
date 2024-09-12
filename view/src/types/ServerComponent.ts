import type SlotRender from "./SlotRender";

/**
 * A component that generates HTML
 */
export default interface ServerComponent {
	name: string;
	render: (
		$props?: Record<string, any>,
		$context?: Record<string, any>,
		$slots?: Record<string, SlotRender>,
	) => void;
}
