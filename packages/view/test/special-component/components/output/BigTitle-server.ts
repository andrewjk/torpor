import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function BigTitle(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += ` <h2> <![>`;
	if ($slots && $slots["_"]) {
		$output += $slots["_"](undefined, $context);
	}
	$output += `<!]><!> </h2> `;

	return $output;
}
