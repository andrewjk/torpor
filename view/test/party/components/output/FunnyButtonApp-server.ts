import type { ServerSlotRender } from "@tera/view";

import FunnyButton from "./FunnyButton.tera";

export default function FunnyButtonApp(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<div> `;

	$output += FunnyButton(undefined, $context)
	$output += ` `;
	const t_slots_1 = {};
	t_slots_1["_"] = ($sprops: Record<PropertyKey, any>, $context: Record<PropertyKey, any>) => {
		let $output = "";
		$output += `Click me!`;
		return $output;
	}

	$output += FunnyButton(undefined, $context, t_slots_1)
	$output += ` </div>`;
	return $output;
}

