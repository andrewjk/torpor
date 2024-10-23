import type { ServerSlotRender } from "@tera/view/ssr";

export default function Head(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<div>  </div>`;

	return $output;
}
