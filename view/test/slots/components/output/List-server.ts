import type SlotRender from "@tera/view";

const List = {
	/**
	 * The component's name.
	 */
	name: "List",
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
		$output += `<ul> <![>`;
		for (let item of $props.items) {
			$output += `<!^> <li> <![>`;
			const t_sprops_1 = {};
			t_sprops_1["item"] = item;
			if ($slots && $slots["_"]) {
				$output += $slots["_"](t_sprops_1, $context);
			}
			$output += `<!]><!> </li> `;
		}
		$output += `<!]><!> </ul>`;
		return $output;
	}
}

export default List;
