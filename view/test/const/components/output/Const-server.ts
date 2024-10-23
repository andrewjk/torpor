import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

export default function Const(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	
	/* User interface */
	let $output = "";
	$output += `<div> `;
	const name = "Boris";
	$output += ` <p> Hello, ${t_fmt(name)}! </p> </div>`;
	
	return $output;
}
