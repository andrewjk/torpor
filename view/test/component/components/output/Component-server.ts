import type { ServerSlotRender } from "@tera/view/ssr";

import Header from './Header.tera';

export default function Component(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	
	/* User interface */
	let $output = "";
	const t_props_1 = {};
	t_props_1["name"] = "Amy";

	$output += Header(t_props_1, $context)
	
	return $output;
}

