import { type SlotRender } from "@torpor/view";

/**
 * Mounts or hydrates the component into the supplied parent node.
 * @param $parent -- The parent node.
 * @param $anchor -- The node to mount the component before.
 * @param $props -- The values that have been passed into the component as properties.
 * @param $context -- Values that have been passed into the component from its ancestors.
 * @param $slots -- Functions for rendering children into slot nodes within the component.
 */
declare function For(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: { text: string }[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default For;
