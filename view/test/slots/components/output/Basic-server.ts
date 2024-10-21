import type { ServerSlotRender } from "@tera/view";
import Header from './Header.tera';

const Basic = {
	/**
	 * The component's name.
	 */
	name: "Basic",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props?: any, $context?: Record<PropertyKey, any>, $slots?: Record<string, ServerSlotRender>) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		const t_slots_1 = {};
		t_slots_1["_"] = ($sprops: Record<PropertyKey, any>, $context: Record<PropertyKey, any>) => {
			let $output = "";
			$output += ` Basic stuff `;
			return $output;
		}

		$output += Header.render(undefined, $context, t_slots_1)
		return $output;
	}
}

export default Basic;
