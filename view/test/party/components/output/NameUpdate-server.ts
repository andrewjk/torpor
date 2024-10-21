import type { SlotRender } from "@tera/view";

const NameUpdate = {
	/**
	 * The component's name.
	 */
	name: "NameUpdate",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		/* User script */
		const $watch = (obj: Record<PropertyKey, any>) => obj;
		let $state = $watch({
			name: "John"
		});
		$state.name = "Jane"
		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		$output += `<h1>Hello ${t_fmt($state.name)}</h1>`;
		return $output;
	}
}

export default NameUpdate;
