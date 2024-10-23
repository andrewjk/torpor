import type { ServerSlotRender } from "@tera/view/ssr";

export default function Element(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += `<${$props.tag}> Hello! </${$props.tag}>`;

	return $output;
}
