import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

import UserProfile from "./UserProfile-server";

export default function UserProfileApp(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	const t_props_1 = {};
	t_props_1["name"] = "John";
	t_props_1["age"] = 20;
	t_props_1["favouriteColors"] = ["green", "blue", "red"];
	t_props_1["isAvailable"] = true;

	$output += UserProfile(t_props_1, $context)

	return $output;
}
