import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function OnMount(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<input>`;

	return $output;
}
