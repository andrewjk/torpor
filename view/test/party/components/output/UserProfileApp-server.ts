import type { SlotRender } from "@tera/view";
import UserProfile from './UserProfile.tera';

const UserProfileApp = {
	/**
	 * The component's name.
	 */
	name: "UserProfileApp",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		const t_props_1 = {};
		t_props_1["name"] = "John";
		t_props_1["age"] = 20;
		t_props_1["favouriteColors"] = ["green", "blue", "red"];
		t_props_1["isAvailable"] = true;

		$output += UserProfile.render(t_props_1, $context)
		return $output;
	}
}

export default UserProfileApp;
