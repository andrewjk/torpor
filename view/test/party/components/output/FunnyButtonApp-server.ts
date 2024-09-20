import type SlotRender from "@tera/view";
import FunnyButton from './FunnyButton.tera';

const FunnyButtonApp = {
	/**
	 * The component's name.
	 */
	name: "FunnyButtonApp",
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
		$output += `<div> `;

		$output += FunnyButton.render(undefined, $context)
		$output += ` `;
		const t_slots_1 = {};
		t_slots_1["_"] = ($sprops, $context) => {
			let $output = "";
			$output += `Click me!`;
			return $output;
		}

		$output += FunnyButton.render(undefined, $context, t_slots_1)
		$output += ` </div>`;
		return $output;
	}
}

export default FunnyButtonApp;
