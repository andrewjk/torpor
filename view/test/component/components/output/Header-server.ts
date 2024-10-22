import type { ServerSlotRender } from "@tera/view";

export default function Header(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};

	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<h2>Hi, ${t_fmt($props.name)}</h2>`;
	return $output;
}

