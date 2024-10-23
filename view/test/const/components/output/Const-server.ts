import type { ServerSlotRender } from "@tera/view";

export default function Const(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<div> `;
	const name = "Boris";
	$output += ` <p> Hello, ${t_fmt(name)}! </p> </div>`;
	
	return $output;
}
