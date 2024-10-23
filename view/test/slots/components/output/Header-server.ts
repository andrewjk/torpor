import type { ServerSlotRender } from "@tera/view";

export default function Header(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<h2> <![>`;
	if ($slots && $slots["_"]) {
		$output += $slots["_"](undefined, $context);
	} else {
		$output += ` Default header... `;
	}
	$output += `<!]><!> </h2>`;
	
	return $output;
}

