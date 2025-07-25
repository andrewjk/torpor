import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

import BigTitle from "../output/./BigTitle-server";
import SmallTitle from "../output/./SmallTitle-server";

export default function Component(
	$props,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};
	let components = {
		BigTitle,
		SmallTitle
	};

	/* User interface */
	let $output = "";
	$output += ` <![>`;
	components[$props.self];
	$output += `<![>`;
	const t_props_1: any = {};
	t_props_1["self"] = components[$props.self];
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = (
		// @ts-ignore
		$sprops?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let $output = "";
		$output += ` Hello! `;
		return $output;
	}

	$output += components[$props.self](t_props_1, $context, t_slots_1)
	$output += `<!]><!>`;
	$output += `<!]><!> `;

	return $output;
}
