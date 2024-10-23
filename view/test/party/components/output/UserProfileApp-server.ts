import type { ServerSlotRender } from "@tera/view";

import UserProfile from "./UserProfile.tera";

export default function UserProfileApp(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	const t_props_1 = {};
	t_props_1["name"] = "John";
	t_props_1["age"] = 20;
	t_props_1["favouriteColors"] = ["green", "blue", "red"];
	t_props_1["isAvailable"] = true;

	$output += UserProfile(t_props_1, $context)
	
	return $output;
}

