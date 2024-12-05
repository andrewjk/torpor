import { $mount } from "@tera/view/ssr";
import type { ServerSlotRender } from "@tera/view/ssr";
import { t_attr } from "@tera/view/ssr";

export default function InputFocused(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	let inputElement;

	$mount(() => {
		// HACK: This is easier to test for
		inputElement.value = "hi";
	});

	/* User interface */
	let $output = "";
	$output += `<input self="${t_attr(inputElement) || ""}">`;

	return $output;
}
