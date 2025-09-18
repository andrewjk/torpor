import $watch from "../../../../src/render/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

import UserProfileContext from "../output/./UserProfileContext-server";

export default function UserProfileContextApp(
	_$props: Record<PropertyKey, any>,
	$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
) {
	$context = Object.assign({}, $context);
	let t_body = "";
	let t_head = "";
	const $user = $watch({
		id: 1,
		username: "unicorn42",
		email: "unicorn42@example.com",
	});

	// TODO: I think we're supposed to unwrap this and pass in an update function?
	$context.user = $user;

	/* User interface */
	t_body += ` <h1>Welcome back, ${t_fmt($user.username)}</h1> <![>`;

	const t_comp_1 = UserProfileContext(undefined, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
