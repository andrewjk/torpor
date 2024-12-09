import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function HelloWorld(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<h1>Hello world</h1>`;

	return $output;
}
