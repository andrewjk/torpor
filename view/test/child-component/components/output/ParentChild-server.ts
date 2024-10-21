import type { SlotRender } from "@tera/view";

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
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		$props ||= {};

		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		$output += `<div> `;
		const t_props_1 = {};
		t_props_1["name"] = "Anna";

		$output += Child.render(t_props_1, $context)
		$output += ` </div>`;
		return $output;
	}
}

const Child = {
	/**
	 * The component's name.
	 */
	name: "Child",
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
		$output += `<h2>Hello, ${t_fmt($props.name)}</h2>`;
		return $output;
	}
}

export default ParentChild;
