import type { ServerSlotRender } from "@tera/view";

const ParentChild = {
	/**
	 * The component's name.
	 */
	name: "ParentChild",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props?: any, $context?: Record<PropertyKey, any>, $slots?: Record<string, ServerSlotRender>) => {
		$props ||= {};

		let $output = "";
		return $output;
	}
}

export default ParentChild;
