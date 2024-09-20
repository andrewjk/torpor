import type SlotRender from "@tera/view";

const IsAvailable = {
	/**
	 * The component's name.
	 */
	name: "IsAvailable",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		/* User script */
		const $watch = (obj) => obj;
		let $state = $watch({
			isAvailable: false
		});
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<div> <div>${t_fmt($state.isAvailable ? "Available" : "Not available")}</div> <input id="is-available" type="checkbox" checked="${$state.isAvailable || false}"/> <label for="is-available">Is available</label> </div>`;
		return $output;
	}
}

export default IsAvailable;
