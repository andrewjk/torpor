import type { SlotRender } from "@tera/view";

const DoubleCount = {
	/**
	 * The component's name.
	 */
	name: "DoubleCount",
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
			count: 10,
			get doubleCount() {
				return this.count * 2;
			}
		});
		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		$output += `<div>${t_fmt($state.doubleCount)}</div>`;
		return $output;
	}
}

export default DoubleCount;
