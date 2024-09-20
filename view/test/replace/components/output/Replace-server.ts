import type SlotRender from "@tera/view";

const Replace = {
	/**
	 * The component's name.
	 */
	name: "Replace",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		$props ||= {};

		/* User script */
		let counter = 0;
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<div> <![>`;
		$props.name;
		$output += ` <p>The replace count is ${t_fmt(counter++)}.</p> `;
		$output += `<!]><!> </div>`;
		return $output;
	}
}

export default Replace;
