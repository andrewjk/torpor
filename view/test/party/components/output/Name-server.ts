import { $watch } from "@tera/view/ssr";
import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

export default function Name(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({
		name: "John"
	});

	/* User interface */
	let $output = "";
	$output += `<h1>Hello ${t_fmt($state.name)}</h1>`;

	return $output;
}
