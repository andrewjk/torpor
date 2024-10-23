import type { ServerSlotRender } from "@tera/view/ssr";

import Header from './Header.tera'

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

