import $unwrap from "../../../../src/render/$serverUnwrap";
import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

import UserProfileContext from "../output/./UserProfileContext-server";

export default function UserProfileContextApp(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
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
	$output += ` <h1>Welcome back, ${t_fmt($user.username)}</h1> <![>`;

	$output += UserProfileContext(undefined, $context)
	$output += `<!]><!> `;

	return $output;
}
