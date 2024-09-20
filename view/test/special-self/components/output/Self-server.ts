import type SlotRender from "@tera/view";

const Self = {
	/**
	 * The component's name.
	 */
	name: "Self",
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
		$output += `<div> Level ${t_fmt($props.level)} <![>`;
		if ($props.level < 3) {
			$output += ` `;
			const t_props_1 = {};
			t_props_1["level"] = $props.level + 1;

			$output += Self.render(t_props_1, $context)
			$output += ` `;
		}
		$output += `<!]><!> </div>`;
		return $output;
	}
}

export default Self;
