import type { SlotRender } from "@tera/view";

const ForIn = {
	/**
	 * The component's name.
	 */
	name: "ForIn",
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
		$output += `<section> <![>`;
		for (let key in $props.item) {
			$output += `<!^> <p> ${t_fmt($props.item[key])} </p> `;
		}
		$output += `<!]><!> </section>`;
		return $output;
	}
}

export default ForIn;
