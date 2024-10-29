import { $watch } from "@tera/view/ssr";
import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

export default function InputHello(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({
		text: "Hello World"
	});

	/* User interface */
	let $output = "";
	$output += `<div> <p>${t_fmt($state.text)}</p> <input value="${$state.text || ""}"> </div>`;

	return $output;
}
