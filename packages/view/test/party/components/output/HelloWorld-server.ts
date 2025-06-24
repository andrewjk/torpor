import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function HelloWorld(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += ` <h1>Hello world</h1> `;

	return $output;
}
