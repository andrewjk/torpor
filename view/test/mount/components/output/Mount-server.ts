import $mount from "../../../../src/render/$serverMount";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";

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
	$output += `<input self="${t_attr(inputElement) || ""}">`;

	return $output;
}
