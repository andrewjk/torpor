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
	$output += `<div ${$props.thing ? `thing="${$props.thing}"` : ''} ${$props.dataThing ? `data-thing="${$props.dataThing}"` : ''} caption="this attribute is for ${$props.description}"> Hello! </div>`;
	return $output;
}

