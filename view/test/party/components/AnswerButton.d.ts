import type { SlotRender } from "@tera/view";

declare namespace AnswerButton {
	/**
	 * The component's name.
	 */
	const name: "AnswerButton";
	/**
	 * Mounts or hydrates the component into the supplied parent node.
	 * @param $parent -- The parent node.
	 * @param $anchor -- The node to mount the component before.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	const render: ($parent: ParentNode, $anchor: Node | null, $props?: {
		onYes: Function;
		onNo: Function;
	}, $context?: Record<PropertyKey, any>, $slots?: Record<string, SlotRender>) => void;
}

export default AnswerButton;
