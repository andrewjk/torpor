import type { ServerSlotRender } from "@tera/view/ssr";

import BigTitle from "./BigTitle.tera";
import SmallTitle from "./SmallTitle.tera";

export default function Component(
	$props,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};
	let components = {
		BigTitle,
		SmallTitle
	};

	/* User interface */
	let $output = "";
	$output += `<![>`;
	components[$props.self];
	const t_props_1 = {};
	t_props_1["self"] = components[$props.self];
	const t_slots_1 = {};
	t_slots_1["_"] = ($sprops: Record<PropertyKey, any>, $context: Record<PropertyKey, any>) => {
		let $output = "";
		$output += ` Hello! `;
		return $output;
	}

	$output += components[$props.self](t_props_1, $context, t_slots_1)
	$output += `<!]><!>`;

	return $output;
}
