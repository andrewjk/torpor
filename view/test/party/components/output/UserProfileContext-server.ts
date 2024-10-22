import type { ServerSlotRender } from "@tera/view";

const $watch = (obj: Record<PropertyKey, any>) => obj;
export default function UserProifleContext(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$context.user = $watch($context.user);

	
	$context = Object.assign({}, $context);
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<div> <h2>My Profile</h2> <p>Username: ${t_fmt($context.user.username)}</p> <p>Email: ${t_fmt($context.user.email)}</p> <button> Update username to Jane </button> </div>`;
	return $output;
}

