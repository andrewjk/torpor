import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

import Header from "./Header-server";

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
