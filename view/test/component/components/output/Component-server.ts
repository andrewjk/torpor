import type { ServerSlotRender } from "@tera/view";

import Header from './Header.tera';

export default function Component(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	const t_props_1 = {};
	t_props_1["name"] = "Amy";

	$output += Header(t_props_1, $context)
	
	return $output;
}

