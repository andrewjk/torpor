import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function UserProfileContext(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$context = Object.assign({}, $context);
	$context.user = $watch($context.user);

	/* User interface */
	let $output = "";
	$output += ` <h2>My Profile</h2> <p>Username: ${t_fmt($context.user.username)}</p> <p>Email: ${t_fmt($context.user.email)}</p> <button> Update username to Jane </button> `;

	return $output;
}
