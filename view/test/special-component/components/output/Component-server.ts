import type { ServerSlotRender } from "@tera/view";

import BigTitle from "./BigTitle.tera";
import SmallTitle from "./SmallTitle.tera";

export default function Component(
	$props,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	let components = {
		BigTitle,
		SmallTitle
	};

	
	$props ??= {};

	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
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

