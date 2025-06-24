import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function SmallTitle(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += ` <h6> <![>`;
	if ($slots && $slots["_"]) {
		$output += $slots["_"](undefined, $context);
	}
	$output += `<!]><!> </h6> `;

	return $output;
}
