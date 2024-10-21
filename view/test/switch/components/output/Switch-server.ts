import type { SlotRender } from "@tera/view";

/**
 * A component with a switch statement in it.
 */
const Switch = {
	/**
	 * The component's name.
	 */
	name: "Switch",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: {
		/** The value to switch on. */
		value: number;
	}, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		$props ||= {};

		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		$output += `<div> <![>`;
		switch ($props.value) {
			case 1: {
				$output += ` <p> A small value. </p> `;
				break;
			}
			case 100: {
				$output += ` <p> A large value. </p> `;
				break;
			}
			default: {
				$output += ` <p> Another value. </p> `;
				break;
			}
		}
		$output += `<!]><!> </div>`;
		return $output;
	}
}

export default Switch;
