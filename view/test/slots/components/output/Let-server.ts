import type { SlotRender } from "@tera/view";
import List from './List.tera';

const Let = {
	/**
	 * The component's name.
	 */
	name: "Let",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		$props ||= {};

		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		const t_props_1 = {};
		t_props_1["items"] = $props.items;
		const t_slots_1 = {};
		t_slots_1["_"] = ($sprops, $context) => {
			let $output = "";
			$output += ` ${t_fmt($sprops.item.text)} `;
			return $output;
		}

		$output += List.render(t_props_1, $context, t_slots_1)
		return $output;
	}
}

export default Let;
