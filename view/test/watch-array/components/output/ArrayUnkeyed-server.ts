import type SlotRender from "@tera/view";

const ArrayUnkeyed = {
	/**
	 * The component's name.
	 */
	name: "ArrayUnkeyed",
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
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<section> <p>^</p> <![>`;
		for (let item of $props.items) {
			$output += `<!^> <p> ${t_fmt(item.text)} </p> `;
		}
		$output += `<!]><!> <p>$</p> </section>`;
		return $output;
	}
}

export default ArrayUnkeyed;
