import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

import Header from "./Header-server";

export default function Component(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	const t_props_1: any = {};
	t_props_1["name"] = "Amy";

	$output += Header(t_props_1, $context)

	return $output;
}
