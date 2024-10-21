import type { SlotRender } from "@tera/view";

const Counter = {
	/**
	 * The component's name.
	 */
	name: "Counter",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		/* User script */
		const $watch = (obj: Record<PropertyKey, any>) => obj;
		let $state = $watch({
			count: 0
		});

		function incrementCount() {
			$state.count++;
		}
		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		$output += `<div> <p>Counter: ${t_fmt($state.count)}</p> <button>+1</button> </div>`;
		return $output;
	}
}

export default Counter;
