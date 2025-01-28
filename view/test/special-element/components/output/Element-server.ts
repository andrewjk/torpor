import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function Element(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<${$props.tag}> Hello! </${$props.tag}>`;

	return $output;
}
