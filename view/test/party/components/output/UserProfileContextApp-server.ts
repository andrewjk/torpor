import type { ServerSlotRender } from "@tera/view";

const $watch = (obj: Record<PropertyKey, any>) => obj;
const $unwrap = (obj: Record<PropertyKey, any>) => obj;
import UserProfileContext from "./UserProfileContext.tera";

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
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<div> <h1>Welcome back, ${t_fmt($user.username)}</h1> `;

	$output += UserProfileContext(undefined, $context)
	$output += ` </div>`;
	return $output;
}

