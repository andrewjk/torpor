import type SlotRender from "@tera/view";

const InputHello = {
	/**
	 * The component's name.
	 */
	name: "InputHello",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		/* User script */
		const $watch = (obj) => obj;
		let $state = $watch({
			text: "Hello World"
		});
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<div> <p>${t_fmt($state.text)}</p> <input value="${$state.text || ""}"/> </div>`;
		return $output;
	}
}

export default InputHello;
