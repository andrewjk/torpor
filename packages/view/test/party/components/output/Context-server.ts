import $watch from "../../../../src/ssr/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function UserProfileContextApp(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
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

function UserProfileContext(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	$context = Object.assign({}, $context);
	let t_body = "";
	let t_head = "";

	$context.user = $watch($context.user);

	/* User interface */
	t_body += ` <h2>My Profile</h2> <p>Username: ${t_fmt($context.user.username)}</p> <p>Email: ${t_fmt($context.user.email)}</p> <button> Update username to Jane </button> `;

	return { body: t_body, head: t_head };
}
