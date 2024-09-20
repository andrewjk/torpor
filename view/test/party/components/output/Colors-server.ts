import type SlotRender from "@tera/view";

const Colors = {
	/**
	 * The component's name.
	 */
	name: "Colors",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		/* User script */
		const colors = ["red", "green", "blue"];
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<ul> <![>`;
		for (let color of colors) {
			$output += `<!^>  <li>${t_fmt(color)}</li> `;
		}
		$output += `<!]><!> </ul>`;
		return $output;
	}
}

export default Colors;
