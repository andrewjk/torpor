import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

import List from "../output/./List-server"

export default function Let(
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += ` <![>`;
	const t_props_1: any = {};
	t_props_1["items"] = $props.items;
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = (
		// @ts-ignore
		$sprops?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let $output = "";
		$output += ` ${t_fmt($sprops.item.text)} `;
		return $output;
	}

	$output += List(t_props_1, $context, t_slots_1)
	$output += `<!]><!> `;

	return $output;
}
