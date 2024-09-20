import type SlotRender from "@tera/view";
import Header from './Header.tera';

const Component = {
	/**
	 * The component's name.
	 */
	name: "Component",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		const t_props_1 = {};
		t_props_1["name"] = "Amy";

		$output += Header.render(t_props_1, $context)
		return $output;
	}
}

export default Component;
