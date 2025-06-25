import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

import Header from "../output/./Header-server"

export default function Basic(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += ` <![>`;
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = (
		// @ts-ignore
		$sprops?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let $output = "";
		$output += ` Basic stuff `;
		return $output;
	}

	$output += Header(undefined, $context, t_slots_1)
	$output += `<!]><!> `;

	return $output;
}
