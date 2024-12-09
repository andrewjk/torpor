import { $mount } from "@tera/view/ssr";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";

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
