import type SlotRender from "@tera/view";

const HelloWorld = {
	/**
	 * The component's name.
	 */
	name: "HelloWorld",
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
		$output += `<h1>Hello world</h1>`;
		return $output;
	}
}

export default HelloWorld;
