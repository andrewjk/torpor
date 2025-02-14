import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function Html(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<p> <![>${$props.html}<!]><!> </p>`;

	return $output;
}
