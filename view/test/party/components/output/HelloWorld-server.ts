import type { ServerSlotRender } from "@tera/view";

export default function HelloWorld(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<h1>Hello world</h1>`;
	return $output;
}

