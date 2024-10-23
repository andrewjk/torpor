import { $mount } from "@tera/view/ssr";
import type { ServerSlotRender } from "@tera/view/ssr";

export default function Mount(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	let inputElement;

	$mount(() => {
		inputElement.value = "hi";
	});

	/* User interface */
	let $output = "";
	$output += `<input self="${inputElement || ""}"/>`;

	return $output;
}
