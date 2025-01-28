import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

import Header from "./Header-server"

export default function Unused(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";

	$output += Header(undefined, $context)

	return $output;
}
