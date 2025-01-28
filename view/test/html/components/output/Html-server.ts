import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function Html(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += `<p> <![>${$props.html}<!]><!> </p>`;

	return $output;
}
