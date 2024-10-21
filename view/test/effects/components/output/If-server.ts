import type { SlotRender } from "@tera/view";

const If = {
	/**
	 * The component's name.
	 */
	name: "If",
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
			$output += ` <p>It's big</p> `;
		}
		else {
			$output += ` <p>It's small</p> `;
		}
		$output += `<!]><!> </div>`;
		return $output;
	}
}

export default If;
