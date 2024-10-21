import type { SlotRender } from "@tera/view";

const Object = {
	/**
	 * The component's name.
	 */
	name: "Object",
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
		$output += `<div> <p> ${t_fmt($props.text)} ${t_fmt($props.child.childText)} ${t_fmt($props.child.grandChild.grandChildText)} </p> </div>`;
		return $output;
	}
}

export default Object;
