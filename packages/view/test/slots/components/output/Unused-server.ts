import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

import Header from "../output/./Header-server"

export default function Unused(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += ` <![>`;

	$output += Header(undefined, $context)
	$output += `<!]><!> `;

	return $output;
}
