import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

import UserProfile from "../output/./UserProfile-server";

export default function UserProfileApp(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += ` `;
	const t_props_1: any = {};
	t_props_1["name"] = "John";
	t_props_1["age"] = 20;
	t_props_1["favouriteColors"] = ["green", "blue", "red"];
	t_props_1["isAvailable"] = true;

	$output += UserProfile(t_props_1, $context)
	$output += `<!> `;

	return $output;
}
