import type { ServerSlotRender } from "@tera/view";

const UserProfile = {
	/**
	 * The component's name.
	 */
	name: "UserProfile",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props?: {
		name: string;
		age: number;
		favouriteColors: string[];
		isAvailable: boolean;
	}, $context?: Record<PropertyKey, any>, $slots?: Record<string, ServerSlotRender>) => {
		$props ||= {};

		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		$output += `<div> <p>My name is ${t_fmt($props.name)}!</p> <p>My age is ${t_fmt($props.age)}!</p> <p>My favourite colors are ${t_fmt($props.favouriteColors.join(", "))}!</p> <p>I am ${t_fmt($props.isAvailable ? "available" : "not available")}</p> </div>`;
		return $output;
	}
}

export default UserProfile;
