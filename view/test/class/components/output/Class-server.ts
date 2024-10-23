import type { ServerSlotRender } from "@tera/view";

export default function For(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<div class="hello" class="${$props.red ? "red" : ""} ${$props.green ? "green" : ""} ${$props.blue ? "blue" : ""}"> Hello! </div>`;
	
	return $output;
}

