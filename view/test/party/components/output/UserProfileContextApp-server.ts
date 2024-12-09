import { $unwrap } from "@tera/view/ssr";
import { $watch } from "@tera/view/ssr";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import { t_fmt } from "@tera/view/ssr";

import UserProfileContext from "./UserProfileContext-server";

export default function UserProfileContextApp(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$context = Object.assign({}, $context);
	const $user = $watch({
		id: 1,
		username: "unicorn42",
		email: "unicorn42@example.com",
	});

	// TODO: I think we're supposed to $unwrap this and pass in an update function?
	$context.user = $user;

	/* User interface */
	let $output = "";
	$output += `<div> <h1>Welcome back, ${t_fmt($user.username)}</h1> `;

	$output += UserProfileContext(undefined, $context)
	$output += ` </div>`;

	return $output;
}
