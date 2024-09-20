import type SlotRender from "@tera/view";

const PickPill = {
	/**
	 * The component's name.
	 */
	name: "PickPill",
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
			picked: "red"
		});
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<div> <div>Picked: ${t_fmt($state.picked)}</div> <input id="blue-pill" group="${$state.picked || ""}" type="radio" value="blue"/> <label for="blue-pill">Blue pill</label> <input id="red-pill" group="${$state.picked || ""}" type="radio" value="red"/> <label for="red-pill">Red pill</label> </div>`;
		return $output;
	}
}

export default PickPill;
