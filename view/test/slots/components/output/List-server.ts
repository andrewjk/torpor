import type { ServerSlotRender } from "@tera/view";

export default function List(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<ul> <![>`;
	for (let item of $props.items) {
		$output += `<!^> <li> <![>`;
		const t_sprops_1 = {};
		t_sprops_1["item"] = item;
		if ($slots && $slots["_"]) {
			$output += $slots["_"](t_sprops_1, $context);
		}
		$output += `<!]><!> </li> `;
	}
	$output += `<!]><!> </ul>`;
	return $output;
}

