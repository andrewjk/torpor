import type { ServerSlotRender } from "@tera/view";

const Const = {
	/**
	 * The component's name.
	 */
	name: "Const",
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
		$output += `<div> `;
		const name = "Boris";
		$output += ` <p> Hello, ${t_fmt(name)}! </p> </div>`;
		return $output;
	}
}

export default Const;
