import type { ServerSlotRender } from "@tera/view";

import Header from './Header.tera'

export default function Basic(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	const t_slots_1 = {};
	t_slots_1["_"] = ($sprops: Record<PropertyKey, any>, $context: Record<PropertyKey, any>) => {
		let $output = "";
		$output += ` Basic stuff `;
		return $output;
	}

	$output += Header(undefined, $context, t_slots_1)
	return $output;
}

