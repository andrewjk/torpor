import type { ServerSlotRender } from "@tera/view";

const BigTitle = {
	/**
	 * The component's name.
	 */
	name: "BigTitle",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props?: any, $context?: Record<PropertyKey, any>, $slots?: Record<string, ServerSlotRender>) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		$output += `<h2> <![>`;
		if ($slots && $slots["_"]) {
			$output += $slots["_"](undefined, $context);
		}
		$output += `<!]><!> </h2>`;
		return $output;
	}
}

export default BigTitle;
