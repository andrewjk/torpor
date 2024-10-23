import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

export default function ParentChild(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<div> `;
	const t_props_1 = {};
	t_props_1["name"] = "Anna";

	$output += Child(t_props_1, $context)
	$output += ` </div>`;

	return $output;
}

function Child(
	$props: { name: string },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += `<h2>Hello, ${t_fmt($props.name)}</h2>`;

	return $output;
}
