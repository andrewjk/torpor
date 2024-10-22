import type { ServerSlotRender } from "@tera/view";

export default function Self(
	$props: { level: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};

	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<div> Level ${t_fmt($props.level)} <![>`;
	if ($props.level < 3) {
		$output += ` `;
		const t_props_1 = {};
		t_props_1["level"] = $props.level + 1;

		$output += Self(t_props_1, $context)
		$output += ` `;
	}
	$output += `<!]><!> </div>`;
	return $output;
}

