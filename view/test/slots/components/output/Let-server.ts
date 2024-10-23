import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

import List from './List.tera'

export default function Let(
	$props: any,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	let $output = "";
	const t_props_1 = {};
	t_props_1["items"] = $props.items;
	const t_slots_1 = {};
	t_slots_1["_"] = ($sprops: Record<PropertyKey, any>, $context: Record<PropertyKey, any>) => {
		let $output = "";
		$output += ` ${t_fmt($sprops.item.text)} `;
		return $output;
	}

	$output += List(t_props_1, $context, t_slots_1)
	
	return $output;
}

