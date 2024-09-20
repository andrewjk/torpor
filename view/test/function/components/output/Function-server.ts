import type SlotRender from "@tera/view";

const Function = {
	/**
	 * The component's name.
	 */
	name: "Function",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		/* User script */
		const $watch = (obj) => obj;
		let $state = $watch({ counter: 0 })
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<div> <button id="increment">Increment</button> `;

		function increment() {
			$state.counter += 1;
		};

		$output += ` <p> The count is ${t_fmt($state.counter)}. </p> </div>`;
		return $output;
	}
}

export default Function;
