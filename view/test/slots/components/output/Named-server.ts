import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

import Article from "./Article-server"

export default function Named(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	const t_slots_1 = {};
	t_slots_1["_"] = ($sprops: Record<PropertyKey, any>, $context: Record<PropertyKey, any>) => {
		let $output = "";
		$output += `  <p> The article's body </p> `;
		return $output;
	}
	t_slots_1["header"] = ($sprops: Record<PropertyKey, any>, $context: Record<PropertyKey, any>) => {
		let $output = "";
		$output += ` The article's header `;
		return $output;
	}

	$output += Article(undefined, $context, t_slots_1)

	return $output;
}
