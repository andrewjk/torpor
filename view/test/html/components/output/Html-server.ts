import type { ServerSlotRender } from "@tera/view";

export default function Html(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};

	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<p> <![>${$props.html}<!]><!> </p>`;
	return $output;
}

