import type { ServerSlotRender } from "@tera/view";
import BigTitle from './BigTitle.tera';
import SmallTitle from './SmallTitle.tera';

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
	render: ($props?: any, $context?: Record<PropertyKey, any>, $slots?: Record<string, ServerSlotRender>) => {
		$props ||= {};

		/* User script */
		let components = {
			BigTitle,
			SmallTitle
		};
		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		$output += `<![>`;
		components[$props.self];
		const t_props_1 = {};
		t_props_1["self"] = components[$props.self];
		const t_slots_1 = {};
		t_slots_1["_"] = ($sprops: Record<PropertyKey, any>, $context: Record<PropertyKey, any>) => {
			let $output = "";
			$output += ` Hello! `;
			return $output;
		}

		$output += components[$props.self].render(t_props_1, $context, t_slots_1)
		$output += `<!]><!>`;
		return $output;
	}
}

export default Component;
