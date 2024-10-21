import type { SlotRender } from "@tera/view";

const Header = {
	/**
	 * The component's name.
	 */
	name: "Header",
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
		$output += `<h2>Hi, ${t_fmt($props.name)}</h2>`;
		return $output;
	}
}

export default Header;
