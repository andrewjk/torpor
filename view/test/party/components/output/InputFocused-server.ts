import type { ServerSlotRender } from "@tera/view";

const InputFocused = {
	/**
	 * The component's name.
	 */
	name: "InputFocused",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props?: any, $context?: Record<PropertyKey, any>, $slots?: Record<string, ServerSlotRender>) => {
		/* User script */
		const $mount = (fn: Function) => null;
		let inputElement;

		$mount(() => {
			// HACK: This is easier to test for
			inputElement.value = "hi";
		});
		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		$output += `<input self="${inputElement || ""}"/>`;
		return $output;
	}
}

export default InputFocused;
