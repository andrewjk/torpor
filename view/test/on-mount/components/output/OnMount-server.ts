import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function OnMount(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<input>`;

	return $output;
}
