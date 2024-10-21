import type { SlotRender } from "@tera/view";
import Article from './Article.tera';

const Named = {
	/**
	 * The component's name.
	 */
	name: "Named",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		const t_slots_1 = {};
		t_slots_1["_"] = ($sprops, $context) => {
			let $output = "";
			$output += `  <p> The article's body </p> `;
			return $output;
		}
		t_slots_1["header"] = ($sprops, $context) => {
			let $output = "";
			$output += ` The article's header `;
			return $output;
		}

		$output += Article.render(undefined, $context, t_slots_1)
		return $output;
	}
}

export default Named;
