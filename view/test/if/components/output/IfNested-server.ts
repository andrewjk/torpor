import type { SlotRender } from "@tera/view";

const IfNested = {
	/**
	 * The component's name.
	 */
	name: "IfNested",
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
		const t_fmt = (text: string) => (text != null ? text : "");
		$output += `<div> <![>`;
		if ($props.counter > 5) {
			$output += ` <![>`;
			if ($props.counter > 10) {
				$output += ` <p> It's both true! </p> `;
			}
			else {
				$output += ` <p> The second is not true! </p> `;
			}
			$output += `<!]><!> `;
		}
		else {
			$output += ` <p> The first is not true! </p> `;
		}
		$output += `<!]><!> </div>`;
		return $output;
	}
}

export default IfNested;
