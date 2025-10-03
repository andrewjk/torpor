import $watch from "../../../../src/render/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function UserProfileContext(
	_$props: Record<PropertyKey, any>,
	$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): void {
	$context = Object.assign({}, $context);
	let t_body = "";
	let t_head = "";

	$context.user = $watch($context.user);

	/* User interface */
	t_body += ` <h2>My Profile</h2> <p>Username: ${t_fmt($context.user.username)}</p> <p>Email: ${t_fmt($context.user.email)}</p> <button> Update username to Jane </button> `;

	return { body: t_body, head: t_head };
}
