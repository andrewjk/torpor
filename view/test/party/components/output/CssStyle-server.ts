import type { SlotRender } from "@tera/view";

const CssStyle = {
	/**
	 * The component's name.
	 */
	name: "CssStyle",
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
		$output += `<div> <h1 class="title tera-1q0qgpq">I am red</h1> <button style="font-size: 10rem;">I am a button</button> </div>`;
		return $output;
	}
}

export default CssStyle;
