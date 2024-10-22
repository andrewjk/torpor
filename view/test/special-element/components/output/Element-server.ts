import type { ServerSlotRender } from "@tera/view";

export default function Element(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};

	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<${$props.tag}> Hello! </${$props.tag}>`;
	return $output;
}

