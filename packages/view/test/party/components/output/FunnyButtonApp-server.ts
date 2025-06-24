import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

import FunnyButton from "../output/./FunnyButton-server";

export default function FunnyButtonApp(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += ` <div> `;

	$output += FunnyButton(undefined, $context)
	$output += `<!> `;
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = (
		// @ts-ignore
		$sprops?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let $output = "";
		$output += `Click me!`;
		return $output;
	}

	$output += FunnyButton(undefined, $context, t_slots_1)
	$output += `<!> </div> `;

	return $output;
}
