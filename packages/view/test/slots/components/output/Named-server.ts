import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

import Article from "../output/./Article-server"

export default function Named(
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
		$output += `  <p> The article's body </p> `;
		return $output;
	}
	t_slots_1["header"] = (
		// @ts-ignore
		$sprops?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let $output = "";
		$output += ` The article's header `;
		return $output;
	}

	$output += Article(undefined, $context, t_slots_1)
	$output += `<!]><!> `;

	return $output;
}
