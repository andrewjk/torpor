import type { ServerSlotRender } from "@tera/view";

const BindText = {
	/**
	 * The component's name.
	 */
	name: "BindText",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props?: any, $context?: Record<PropertyKey, any>, $slots?: Record<string, ServerSlotRender>) => {
		/* User script */
		const $watch = (obj: Record<PropertyKey, any>) => obj;
		let $state = $watch({ name: "Alice" });
		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		$output += `<div> <input value="${$state.name || ""}"/> <p>Hello, ${t_fmt($state.name)}</p> </div>`;
		return $output;
	}
}

export default BindText;
