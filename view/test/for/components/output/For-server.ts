import type SlotRender from "@tera/view";

const For = {
	/**
	 * The component's name.
	 */
	name: "For",
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
		$output += `<section> <![>`;
		for (let i = 0; i < 5; i++) {
			$output += `<!^> <p> ${t_fmt(i)} </p> `;
		}
		$output += `<!]><!> </section>`;
		return $output;
	}
}

export default For;
