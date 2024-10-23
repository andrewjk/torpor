import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

export default function Self(
	$props: { level: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
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
