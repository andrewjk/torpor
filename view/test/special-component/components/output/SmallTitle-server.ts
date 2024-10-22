import type { ServerSlotRender } from "@tera/view";

export default function SmallTitle(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<h6> <![>`;
	if ($slots && $slots["_"]) {
		$output += $slots["_"](undefined, $context);
	}
	$output += `<!]><!> </h6>`;
	return $output;
}

